# Login Skeleton

Bu workspace endi ikkita alohida papkadan iborat:

- `Frontend` - React + Vite login interfeysi
- `Backend` - Express login API

## Texnologiyalar

- `Frontend`: React + Vite
- `Backend`: Express
- `Saqlash`: hozircha JSON store (`Backend/src/data/store.json`)

## Demo login

- Telefon: `+998901234567`
- Parol: `123456`

## Ishga tushirish

### Backend

```bash
cd Backend
npm install
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

## Build

```bash
cd Frontend
npm run build
```

## GitHub

Root papkada git repo ishlatiladi. Push qilish uchun:

```bash
git init
git add .
git commit -m "Initial project setup"
git remote add origin <github-repo-url>
git push -u origin main
```

## Render

Backend uchun root’da `render.yaml` qo‘shilgan. Render service yaratilganda:

- Root directory: `Backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment variable: `FRONTEND_URL=https://your-vercel-app.vercel.app`

## Vercel

Frontend uchun `Frontend/vercel.json` qo‘shilgan. Vercel’da:

- Project root: `Frontend`
- Environment variable: `VITE_API_URL=https://your-render-service.onrender.com/api`

## MongoDB Atlas

Hozir backend file-based JSON store bilan ishlaydi. Atlas ulash uchun backend saqlash qatlami alohida MongoDB model va query’larga ko‘chirilishi kerak.
