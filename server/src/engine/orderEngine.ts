import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/db';
import { currentGameState } from '../lib/state';
import { broadcastLedger, sendTeamUpdate } from './socketEngine';

export async function handleCreateOrder(io: Server, socket: Socket, user: any, data: any) {
  try {
    if (currentGameState !== 'RUNNING' && user.role !== 'ADMIN') {
      throw new Error(`The realm is ${currentGameState.toLowerCase().replace('_', ' ')}. Trading is disabled.`);
    }
    const { resourceType, orderType, amount, price, targetTeamId } = data;
    
    if (user.role === 'ADMIN') {
      let finalTargetId = null;
      if (targetTeamId) {
        const t = await prisma.team.findUnique({ where: { teamId: targetTeamId } });
        if (!t) throw new Error(`Target team '${targetTeamId}' not found`);
        finalTargetId = t.id;
      }

      if (Number(amount) <= 0 || Number(price) <= 0 || !Number.isInteger(Number(amount)) || !Number.isInteger(Number(price))) {
        throw new Error("Amount and Price must be positive integers");
      }

      await prisma.order.create({
        data: {
          creatorId: user.id,
          resourceType,
          orderType,
          amount: Number(amount),
          price: Number(price),
          targetTeamId: finalTargetId,
          isAdminOrder: true
        }
      });
      broadcastLedger(io);
      return;
    }

    await prisma.$transaction(async (tx) => {
      const team = await tx.team.findUnique({ where: { id: user.id } });
      if (!team) throw new Error("Team not found");

      const amt = Number(amount);
      const prc = Number(price);
      
      if (amt <= 0 || prc <= 0 || !Number.isInteger(amt)) {
        throw new Error("Amount must be a positive integer and Price must be positive");
      }

      if (orderType === 'SELL') {
        const available = resourceType === 'FOOD' ? team.food - team.escrowFood : team.material - team.escrowMaterial;
        if (available < amt) throw new Error(`Insufficient ${resourceType} balance`);
        
        await tx.team.update({
          where: { id: user.id },
          data: resourceType === 'FOOD' 
            ? { escrowFood: { increment: amt } }
            : { escrowMaterial: { increment: amt } }
        });
      } else if (orderType === 'BUY') {
        const cost = Math.round(amt * prc);
        const available = team.gold - team.escrowGold;
        if (available < cost) throw new Error("Insufficient Gold balance");

        await tx.team.update({
          where: { id: user.id },
          data: { escrowGold: { increment: cost } }
        });
      }

      let finalTargetId = null;
      if (targetTeamId) {
        const t = await tx.team.findUnique({ where: { teamId: targetTeamId } });
        if (!t) throw new Error(`Target team '${targetTeamId}' not found`);
        finalTargetId = t.id;
      }

      await tx.order.create({
        data: {
          creatorId: user.id,
          resourceType,
          orderType,
          amount: amt,
          price: prc,
          targetTeamId: finalTargetId,
        }
      });
    });

    broadcastLedger(io);
    sendTeamUpdate(io, user.id);
  } catch (err: any) {
    socket.emit('error_message', err.message);
  }
}

export async function handleAcceptOrder(io: Server, socket: Socket, user: any, orderId: number) {
  try {
    if (currentGameState !== 'RUNNING') {
      throw new Error(`The realm is ${currentGameState.toLowerCase().replace('_', ' ')}. Trading is disabled.`);
    }
    if (user.role === 'ADMIN') throw new Error("Admin cannot accept player orders directly");
    
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.status !== 'OPEN') throw new Error("Order is no longer available");
      if (order.creatorId === user.id) throw new Error("Cannot accept your own order");
      if (order.targetTeamId && order.targetTeamId !== user.id) throw new Error("This is a private order for another team");

      const buyerId = order.orderType === 'SELL' ? user.id : order.creatorId;
      const sellerId = order.orderType === 'SELL' ? order.creatorId : user.id;
      const cost = Math.round(order.amount * order.price);

      const buyer = await tx.team.findUnique({ where: { id: buyerId } });
      const seller = await tx.team.findUnique({ where: { id: sellerId } });
      if (!buyer || !seller) throw new Error("Team not found");
      
      if (buyerId === user.id) { 
        if (buyer.gold - buyer.escrowGold < cost) throw new Error("Insufficient Gold to accept this order");
      }
      if (sellerId === user.id) { 
        const availableRes = order.resourceType === 'FOOD' ? seller.food - seller.escrowFood : seller.material - seller.escrowMaterial;
        if (availableRes < order.amount) throw new Error(`Insufficient ${order.resourceType} to accept this order`);
      }

      if (!order.isAdminOrder) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'FILLED' }
        });
      }

      if (buyer.role !== 'ADMIN') {
        await tx.team.update({
          where: { id: buyerId },
          data: {
            gold: { decrement: cost },
            ...(buyerId === order.creatorId ? { escrowGold: { decrement: cost } } : {}),
            ...(order.resourceType === 'FOOD' ? { food: { increment: order.amount } } : { material: { increment: order.amount } })
          }
        });
      }

      if (seller.role !== 'ADMIN') {
        await tx.team.update({
          where: { id: sellerId },
          data: {
            gold: { increment: cost },
            ...(order.resourceType === 'FOOD' ? 
               { food: { decrement: order.amount }, ...(sellerId === order.creatorId ? { escrowFood: { decrement: order.amount } } : {}) } :
               { material: { decrement: order.amount }, ...(sellerId === order.creatorId ? { escrowMaterial: { decrement: order.amount } } : {}) }
            )
          }
        });
      }

      const verb = order.orderType === 'SELL' ? 'Bought' : 'Sold';
      const msg = `${verb} ${order.amount} ${order.resourceType} for ${cost} Gold.`;
      await tx.mail.create({ data: { teamId: user.id, title: 'Trade Executed', body: msg }});
      
      if (!order.isAdminOrder) {
        const creatorVerb = order.orderType === 'SELL' ? 'Sold' : 'Bought';
        const creatorMsg = `${creatorVerb} ${order.amount} ${order.resourceType} for ${cost} Gold.`;
        await tx.mail.create({ data: { teamId: order.creatorId, title: 'Trade Executed', body: creatorMsg }});
      }

      return { creatorId: order.creatorId, isAdminOrder: order.isAdminOrder };
    });

    broadcastLedger(io);
    sendTeamUpdate(io, user.id);
    if (!result.isAdminOrder) {
      sendTeamUpdate(io, result.creatorId);
    }
  } catch (err: any) {
    socket.emit('error_message', err.message);
  }
}

export async function handleInteractAdminOrder(io: Server, socket: Socket, user: any, payload: { action: 'BUY_FROM_ADMIN' | 'SELL_TO_ADMIN', resourceType: 'FOOD' | 'MATERIAL', amount: number }) {
  try {
    if (currentGameState !== 'RUNNING') {
      throw new Error(`The realm is ${currentGameState.toLowerCase().replace('_', ' ')}. Trading is disabled.`);
    }
    if (user.role === 'ADMIN') throw new Error("Admin cannot trade with itself");

    const amt = Math.floor(payload.amount);
    if (amt <= 0) throw new Error("Amount must be positive");

    await prisma.$transaction(async (tx) => {
      const adminOrderType = payload.action === 'BUY_FROM_ADMIN' ? 'SELL' : 'BUY';
      const standingOrder = await tx.order.findFirst({
        where: { isAdminOrder: true, resourceType: payload.resourceType, orderType: adminOrderType }
      });
      if (!standingOrder) throw new Error(`Imperial ${adminOrderType} edict for ${payload.resourceType} not found`);
      if (standingOrder.status !== 'OPEN') throw new Error(`Imperial trade is currently closed.`);

      const cost = Math.round(amt * standingOrder.price);
      const player = await tx.team.findUnique({ where: { id: user.id } });
      if (!player) throw new Error("Player not found");

      if (payload.action === 'BUY_FROM_ADMIN') {
        if (player.gold - player.escrowGold < cost) throw new Error("Insufficient Gold to buy from Citadel");
        await tx.team.update({
          where: { id: user.id },
          data: {
            gold: { decrement: cost },
            ...(payload.resourceType === 'FOOD' ? { food: { increment: amt } } : { material: { increment: amt } })
          }
        });
      } else {
        const availableRes = payload.resourceType === 'FOOD' ? player.food - player.escrowFood : player.material - player.escrowMaterial;
        if (availableRes < amt) throw new Error(`Insufficient ${payload.resourceType} to sell to Citadel`);
        await tx.team.update({
          where: { id: user.id },
          data: {
            gold: { increment: cost },
            ...(payload.resourceType === 'FOOD' ? { food: { decrement: amt } } : { material: { decrement: amt } })
          }
        });
      }

      const verb = payload.action === 'BUY_FROM_ADMIN' ? 'Bought' : 'Sold';
      const msg = `${verb} ${amt} ${payload.resourceType} from Imperial Citadel for ${cost} Gold.`;
      await tx.mail.create({ data: { teamId: user.id, title: 'Imperial Trade Executed', body: msg }});
    });

    broadcastLedger(io);
    sendTeamUpdate(io, user.id);
  } catch (err: any) {
    socket.emit('error_message', err.message);
  }
}

export async function handleCancelOrder(io: Server, socket: Socket, user: any, orderId: number) {
  try {
    const creatorId = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.status !== 'OPEN') throw new Error("Order not found or already closed");
      if (order.creatorId !== user.id && user.role !== 'ADMIN') throw new Error("Unauthorized to cancel this order");

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });

      if (!order.isAdminOrder) {
        if (order.orderType === 'SELL') {
          await tx.team.update({
            where: { id: order.creatorId },
            data: order.resourceType === 'FOOD' 
              ? { escrowFood: { decrement: order.amount } }
              : { escrowMaterial: { decrement: order.amount } }
          });
        } else {
          const cost = order.amount * order.price;
          await tx.team.update({
            where: { id: order.creatorId },
            data: { escrowGold: { decrement: cost } }
          });
        }
      }
      return order.creatorId;
    });

    broadcastLedger(io);
    sendTeamUpdate(io, creatorId);
  } catch (err: any) {
    socket.emit('error_message', err.message);
  }
}
