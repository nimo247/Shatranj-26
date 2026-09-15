export interface DisasterTemplate {
  name: string;
  scope: string;
  description: string;
  effect: string;
  regionsHit: string;
  defaultMaxCap: number;
  flatFood: number;
  flatMaterial: number;
  flatGold: number;
  flatLossTarget: 'ACTIVE' | 'BUILT';
  grid: {
    base: { f: number, m: number, g: number },
    foodCard: { f: number, m: number, g: number },
    materialCard: { f: number, m: number, g: number },
    luxuryCard: { f: number, m: number, g: number }
  };
  modifiers: {
    foodSustain: number;
    foodReturn: number;
    materialSustain: number;
    materialReturn: number;
    goldSustain: number;
    goldReturn: number;
  };
}

export const disasterTemplates: DisasterTemplate[] = [
  {
    "name": "The Great Continental Drought",
    "scope": "CONTINENTAL",
    "description": "The seasonal rains fail across the entire continent, devastating agricultural yields.",
    "effect": "Lose 100 Food from your stockpile for every Active [FOOD] card at the moment of pause (capped at 50% of a team's total stockpile), AND all [FOOD] Yields on Active cards are reduced by 50% for this round.",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 100,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": -0.5,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Locust Swarm",
    "scope": "CONTINENTAL",
    "description": "A massive swarm of insects blots out the sun, devouring standing crops in active fields.",
    "effect": "Lose 100 Food from your stockpile for every Active [FOOD] card at the moment of pause (capped at 50% of a team's total stockpile).",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 100,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Continental Labor Strike",
    "scope": "CONTINENTAL",
    "description": "Overworked laborers across the empire drop their tools and demand better conditions.",
    "effect": "For this round only, all [MATERIAL] Maintenance costs on all Active cards are Doubled.",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 1.0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Silk & Spice Blockade",
    "scope": "CONTINENTAL",
    "description": "Foreign merchants halt their caravans, causing a massive crash in luxury trade value.",
    "effect": "Immediate flat loss of 300 Gold from all stockpiles (capped at 50% of a team's total stockpile), AND all [LUXURY] Yields on Active cards are reduced by 50% for this round.",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 300,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": -0.5
    }
  },
  {
    "name": "The Grand Corruption",
    "scope": "CONTINENTAL",
    "description": "Imperial tax collectors audit estates and skim heavily from noble manors and luxury storehouses.",
    "effect": "Lose 100 Gold from your stockpile for every Built [LUXURY] card you own (capped at 50% of a team's total stockpile).",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "BUILT",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 100
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Tool Shortage",
    "scope": "CONTINENTAL",
    "description": "A severe lack of bronze and iron tools brings continental construction to a crawl.",
    "effect": "All [MATERIAL] Yields on Active cards are reduced by 50% for this round.",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": -0.5,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Freezing Winter",
    "scope": "CONTINENTAL",
    "description": "A sudden, brutal drop in temperature forces leaders to burn vast resources to keep workers alive.",
    "effect": "For this round only, all [FOOD] Maintenance costs on all Active cards are Doubled.",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 1.0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Peasant Revolt",
    "scope": "CONTINENTAL",
    "description": "Widespread anger leads to violent riots targeting active factory lines, noisy foundries, and quarries.",
    "effect": "Lose 100 Materials from your stockpile for every Active [MATERIAL] card at the moment of pause (capped at 50% of a team's total stockpile).",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 100,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Sovereign's Heavy Tithe",
    "scope": "CONTINENTAL",
    "description": "The Imperial Citadel demands massive emergency cash contributions from all operating industries.",
    "effect": "For this round only, all Gold Maintenance costs on all Active cards are Doubled.",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 1.0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Plague of Boils",
    "scope": "CONTINENTAL",
    "description": "A horrific sickness sweeps the continent, crippling the active workforce of the largest monuments.",
    "effect": "Lose 100 Food, 100 Materials, and 100 Gold from your stockpile for every Active Elite Card at the moment of pause (capped at 50% of a team's total stockpile), AND all Maintenance costs on Active Elite cards are Tripled for this round.",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Great Wildfire",
    "scope": "CONTINENTAL",
    "description": "Unstoppable raging blazes sweep across the mainland, incinerating permanent lumberyards, estates, and stone workshops.",
    "effect": "Lose 100 Materials from your stockpile for every Built card you own (capped at 50% of a team's total stockpile).",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "BUILT",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 100,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 100,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 100,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Imperial Currency Debasement",
    "scope": "CONTINENTAL",
    "description": "The Citadel dilutes coin purity, triggering hyper-inflation and panic across commercial trading posts.",
    "effect": "Immediate flat loss of 400 Gold from all stockpiles (capped at 50% of a team's total stockpile), AND all Gold Yields on Active cards are reduced by 50% for this round.",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 400,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": -0.5
    }
  },
  {
    "name": "The Coal Famine & Smelter Collapse",
    "scope": "CONTINENTAL",
    "description": "Continental fuel deposits run dry, starving furnaces and halting refined metallurgy.",
    "effect": "All [MATERIAL] Yields on Active cards are reduced by 50%, AND for this round only, all [MATERIAL] Maintenance costs on Active cards are Doubled.",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 1.0,
      "materialReturn": -0.5,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Merchant Cartel Embargo",
    "scope": "CONTINENTAL",
    "description": "Powerful oligarch cartels monopolize shipping routes and squeeze independent estates.",
    "effect": "Lose 100 Gold from your stockpile for every Active [LUXURY] or [FOOD] card at the moment of pause (capped at 50% of a team's total stockpile).",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 100
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 100
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Zealot Iconoclasm",
    "scope": "CONTINENTAL",
    "description": "Religious fanatics rampage across the empire, targeting ostentatious monuments, temples, and foreign relics.",
    "effect": "Lose 150 Gold and 150 Materials from your stockpile for every Built Elite Card you own (capped at 50% of a team's total stockpile).",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "BUILT",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Poisoned Aquifers",
    "scope": "CONTINENTAL",
    "description": "Noxious runoff taints continental waterways, sickening livestock and contaminating active industrial watermills.",
    "effect": "Lose 100 Food and 100 Materials from your stockpile for every Active card at the moment of pause (capped at 50% of a team's total stockpile).",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 100,
        "m": 100,
        "g": 0
      },
      "materialCard": {
        "f": 100,
        "m": 100,
        "g": 0
      },
      "luxuryCard": {
        "f": 100,
        "m": 100,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Salt Blight",
    "scope": "CONTINENTAL",
    "description": "Salt reserves spoil simultaneously across the provinces, causing mass preservation failures in permanent granaries and storehouses.",
    "effect": "Lose 150 Food from your stockpile for every Built [FOOD] card you own (capped at 50% of a team's total stockpile).",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "BUILT",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 150,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Mercenary Protection Racket",
    "scope": "CONTINENTAL",
    "description": "Rogue sellswords patrol the territories, demanding steep protection bribes to keep active work crews from being slaughtered.",
    "effect": "Lose 75 Gold from your stockpile for every Active card operating at the moment of pause (capped at 50% of a team's total stockpile).",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 75
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 75
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 75
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Continental Seismic Settling",
    "scope": "CONTINENTAL",
    "description": "Low-frequency tectonic shifts crack aqueducts, stone arches, and foundations across all provinces.",
    "effect": "Lose 50 Materials and 50 Gold from your stockpile for every Built card you own (capped at 50% of a team's total stockpile).",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "BUILT",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 50,
        "g": 50
      },
      "materialCard": {
        "f": 0,
        "m": 50,
        "g": 50
      },
      "luxuryCard": {
        "f": 0,
        "m": 50,
        "g": 50
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Master Artisan Exodus",
    "scope": "CONTINENTAL",
    "description": "Highly skilled guildmasters flee imperial territories, causing catastrophic quality drop in all active production lines.",
    "effect": "All Yields (Food, Material, Gold) on all Active cards are reduced by 50% for this round.",
    "regionsHit": "Whole Continent",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": -0.5,
      "materialSustain": 0,
      "materialReturn": -0.5,
      "goldSustain": 0,
      "goldReturn": -0.5
    }
  },
  {
    "name": "The Blinding Sandstorm",
    "scope": "REGIONAL",
    "description": "A massive wall of sand sweeps through the Western Sands, burying infrastructure.",
    "effect": "Immediate flat loss of 400 Materials from regional stockpiles (capped at 50% of a team's total stockpile).",
    "regionsHit": "The Fayum Oasis, The Royal Necropolis, The Elephantine Outpost",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 400,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Red Tide",
    "scope": "REGIONAL",
    "description": "Toxic algae blooms choke the Northern Sea and Delta, killing fish and fouling the water.",
    "effect": "Immediate flat loss of 400 Food from regional stockpiles (capped at 50% of a team's total stockpile).",
    "regionsHit": "The Delta Basin, The Red Sea Harbors",
    "defaultMaxCap": 0.5,
    "flatFood": 400,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Great River Blockade",
    "scope": "REGIONAL",
    "description": "Silt buildup and wrecked barges completely choke the central riverways.",
    "effect": "Immediate flat loss of 400 Gold from regional stockpiles (capped at 50% of a team's total stockpile).",
    "regionsHit": "The Theban Floodplains, The Memphis Crossroads",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 400,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Eastern Fault Quake",
    "scope": "REGIONAL",
    "description": "A violent earthquake shatters the Eastern Spine and disturbs the Gulf.",
    "effect": "Immediate flat loss of 400 Materials from regional stockpiles (capped at 50% of a team's total stockpile).",
    "regionsHit": "The Eastern Granite Quarries, The Sinai Copper Mines",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 400,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Violent Flash Floods",
    "scope": "REGIONAL",
    "description": "The southern riverbanks burst, washing away settlements and livestock.",
    "effect": "Immediate flat loss of 400 Food from regional stockpiles (capped at 50% of a team's total stockpile).",
    "regionsHit": "The Nubian Cataracts, The Theban Floodplains",
    "defaultMaxCap": 0.5,
    "flatFood": 400,
    "flatMaterial": 0,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Deep Desert Bandits",
    "scope": "REGIONAL",
    "description": "Ruthless marauders from the deep south and west raid the isolated outposts.",
    "effect": "Immediate flat loss of 400 Gold from regional stockpiles (capped at 50% of a team's total stockpile).",
    "regionsHit": "The Elephantine Outpost, The Royal Necropolis",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 400,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Aquifer Collapse",
    "scope": "REGIONAL",
    "description": "Underground water systems cave in, ruining local irrigation networks.",
    "effect": "Immediate flat loss of 200 Materials and 200 Food from regional stockpiles (capped at 50% of a team's total stockpile).",
    "regionsHit": "The Fayum Oasis, The Delta Basin",
    "defaultMaxCap": 0.5,
    "flatFood": 200,
    "flatMaterial": 200,
    "flatGold": 0,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Highland Avalanches",
    "scope": "REGIONAL",
    "description": "Massive rockslides cut off the southern cataracts and eastern mountain ridges.",
    "effect": "Immediate flat loss of 200 Materials and 200 Gold from regional stockpiles (capped at 50% of a team's total stockpile).",
    "regionsHit": "The Nubian Cataracts, The Eastern Granite Quarries",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 200,
    "flatGold": 200,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Trade Fleet Mutiny",
    "scope": "REGIONAL",
    "description": "Sailors and merchants strike, completely shutting down harbors and central hubs.",
    "effect": "Immediate flat loss of 400 Gold from regional stockpiles (capped at 50% of a team's total stockpile).",
    "regionsHit": "The Red Sea Harbors, The Memphis Crossroads",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 0,
    "flatGold": 400,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  },
  {
    "name": "The Deep Mine Gas Explosion",
    "scope": "REGIONAL",
    "description": "A catastrophic explosion rips through the deepest veins of the eastern peninsula.",
    "effect": "Immediate flat loss of 200 Materials and 200 Gold from regional stockpiles (capped at 50% of a team's total stockpile).",
    "regionsHit": "The Sinai Copper Mines",
    "defaultMaxCap": 0.5,
    "flatFood": 0,
    "flatMaterial": 200,
    "flatGold": 200,
    "flatLossTarget": "ACTIVE",
    "grid": {
      "base": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "foodCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "materialCard": {
        "f": 0,
        "m": 0,
        "g": 0
      },
      "luxuryCard": {
        "f": 0,
        "m": 0,
        "g": 0
      }
    },
    "modifiers": {
      "foodSustain": 0,
      "foodReturn": 0,
      "materialSustain": 0,
      "materialReturn": 0,
      "goldSustain": 0,
      "goldReturn": 0
    }
  }
];
