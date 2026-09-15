# Deploy Shatranj on Railway

1. Push this project to GitHub.
2. In Railway, create a **New Project** and select **Deploy from GitHub repo**.
3. Select the Shatranj repository. Railway will use the included Dockerfile automatically.
4. Open the service, go to **Variables**, and add:
   - `JWT_SECRET`: a long random value.
   - `ADMIN_KEYWORD`: the admin login password.
5. Add a **Volume** to the service and mount it at `/app/server/prisma/data`.
6. In **Settings > Networking**, click **Generate Domain**.
7. Wait for `/health` to report healthy, then open the generated HTTPS URL.

The application must remain at one replica because it uses Socket.IO process state and SQLite.
