import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

export const getAvatarsUploadDir = () => {
  // When compiled: dist/src/auth/ -> dist/uploads/avatars or root uploads/avatars
  const cwdRelative = join(process.cwd(), 'uploads', 'avatars');
  const backendRelative = join(__dirname, '..', '..', 'uploads', 'avatars');
  const target = existsSync(join(process.cwd(), 'uploads')) ? cwdRelative : backendRelative;
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }
  return target;
};

export const avatarUploadOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const dir = getAvatarsUploadDir();
      cb(null, dir);
    },
    filename: (req: any, file, cb) => {
      const ext = extname(file.originalname).toLowerCase() || '.png';
      const userId = req.user?.id || 'user';
      const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `avatar-${cleanUserId}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|svg\+xml)$/)) {
      return cb(
        new BadRequestException('Only image files (JPEG, PNG, WEBP, GIF, SVG) are allowed!'),
        false,
      );
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
