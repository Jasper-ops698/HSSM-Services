# MultiShop

## Description

MultiShop is a platform where users can register to provide and book services. Users can access the app through a browser via the link shared in the blog post.

## Deployment configuration

- **Backend (Azure App Service)** – deployed to `https://hssmservices-cwggbkcpadg2d3be.uaenorth-01.azurewebsites.net`. The backend code now lives directly in the monorepo under `backend/` (no git submodule required).
- **Frontend (Azure Static Web App)** – built from `frontend/frontend`. The GitHub Action sets `REACT_APP_API_URL` during the build so the SPA talks to the Azure backend. Legacy static assets are archived under `frontend/legacy/` for reference.
- **Environment overrides** – for local development create `frontend/frontend/.env.local` and set `REACT_APP_API_URL=http://localhost:4000` (the default production `.env` already targets Azure). Ensure the backend `ALLOWED_ORIGINS` app setting includes both the Static Web App domain and any local origins you use.

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add new feature'`)
5. Push to the branch (`git push origin feature-branch`)
6. Create a pull request

Merges will be accepted after authorization by the admin.

## License

This project is licensed under the MIT License.

## Contact

- Email: bkitib@gmail.com / bkitib2@gmail.com
- Website: [Your Website](http://yourwebsite.com)

Feel free to edit this draft to better suit your needs. Let me know if you need any further assistance!
