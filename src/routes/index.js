import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
  });
});

router.use('/productos', productRoutes);
router.use('/auth', authRoutes);

export default router;
