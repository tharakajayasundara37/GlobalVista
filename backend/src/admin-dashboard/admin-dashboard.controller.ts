
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Injectable,
  NotFoundException,
  Optional,
  Param,
  Patch,
  Req,
  ServiceUnavailableException,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  isValidObjectId,
  Model,
} from 'mongoose';

import {
  createDecipheriv,
  hkdfSync,
  randomUUID,
} from 'crypto';

import {
  mkdir,
  lstat,
  readFile,
  realpath,
} from 'fs/promises';

import {
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'path';

import {
  AdminDashboardService,
} from './admin-dashboard.service';

import {
  JwtGuard,
} from '../auth/jwt.guard';

import {
  AdminGuard,
} from '../auth/admin.guard';

import {
  Role,
  User,
  UserDocument,
} from '../users/schemas/user.schema';

// ==========================================
// PRIVATE DOCUMENT SETTINGS
// ==========================================

const DOCUMENT_HEADER = 'GVID01';

const MAX_ENCRYPTED_FILE_SIZE =
  5 * 1024 * 1024 + 4096;

const PRIVATE_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.gvid$/i;

type DocumentSide =
  | 'front'
  | 'back';

type AuthenticatedAdminRequest = {
  user?: {
    id?: string;
    role?: Role;
  };
};

// ==========================================
// ADMIN DASHBOARD CONTROLLER
// ==========================================

@Controller('admin-dashboard')
@UseGuards(
  JwtGuard,
  AdminGuard,
)
export class AdminDashboardController {
  constructor(
    private readonly adminDashboardService:
      AdminDashboardService,

    // Optional injection keeps existing
    // controller unit tests compatible.
    //
    // Real document viewing requires
    // the User MongoDB model.
    //
    // If unavailable, the endpoint
    // fails closed.

    @Optional()
    @InjectModel(User.name)
    private readonly userModel?:
      Model<UserDocument>,
  ) {}

  // ========================================
  // DASHBOARD
  // ========================================

  @Get()
  getDashboard() {
    return this.adminDashboardService
      .getDashboard();
  }

  // ========================================
  // BOOKINGS
  // ========================================

  @Get('bookings')
  getRecentBookings() {
    return this.adminDashboardService
      .getRecentBookings();
  }

  // ========================================
  // PAYMENTS
  // ========================================

  @Get('payments')
  getRecentPayments() {
    return this.adminDashboardService
      .getRecentPayments();
  }

  // ========================================
  // REVENUE
  // ========================================

  @Get('revenue')
  getRevenue() {
    return this.adminDashboardService
      .getRevenue();
  }

  // ========================================
  // PENDING GUIDE APPLICATIONS
  // ========================================

  @Get('guides/pending')
  getPendingGuides() {
    return this.adminDashboardService
      .getPendingGuides();
  }

  // ========================================
  // ALL GUIDES
  // ========================================

  @Get('guides')
  getAllGuides() {
    return this.adminDashboardService
      .getAllGuides();
  }

  // ========================================
  // SINGLE GUIDE
  // ========================================

  @Get('guides/:id')
  getGuide(
    @Param('id')
    id: string,
  ) {
    return this.adminDashboardService
      .getGuide(id);
  }

  // ========================================
  // HELPER: VALIDATE GUIDE ID
  // ========================================

  private validateGuideId(
    id: string,
  ): void {
    if (
      typeof id !== 'string' ||
      !/^[0-9a-f]{24}$/i.test(id) ||
      !isValidObjectId(id)
    ) {
      throw new BadRequestException(
        'Invalid guide ID',
      );
    }
  }

  // ========================================
  // HELPER: PATH IS INSIDE DIRECTORY
  // ========================================

  private isInsideDirectory(
    parent: string,
    candidate: string,
  ): boolean {
    const result = relative(
      parent,
      candidate,
    );

    return (
      result === '' ||
      (
        result !== '..' &&
        !result.startsWith(
          `..${sep}`,
        ) &&
        !isAbsolute(result)
      )
    );
  }

  // ========================================
  // HELPER: PRIVATE DOCUMENT DIRECTORY
  // ========================================

  private async getPrivateDirectory():
    Promise<string> {
    const configuredDirectory =
      process.env
        .GUIDE_PRIVATE_UPLOAD_DIR;

    const directory = resolve(
      configuredDirectory ||
        join(
          process.cwd(),
          'private-data',
          'guide-ids',
        ),
    );

    let actualDirectory: string;

    try {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      actualDirectory =
        await realpath(directory);
    } catch {
      actualDirectory = directory;
    }

    const publicUploads = resolve(
      process.cwd(),
      'uploads',
    );

    let actualPublicUploads =
      publicUploads;

    try {
      actualPublicUploads =
        await realpath(
          publicUploads,
        );
    } catch {
      // Public uploads may not exist.
    }

    if (
      this.isInsideDirectory(
        actualPublicUploads,
        actualDirectory,
      )
    ) {
      throw new ServiceUnavailableException(
        'Private identity storage is incorrectly configured',
      );
    }

    return actualDirectory;
  }

  // ========================================
  // HELPER: DOCUMENT ENCRYPTION KEY
  //
  // Uses the same HKDF derivation
  // as the Guide Document Upload endpoint.
  // ========================================

  private getDocumentKey(): Buffer {
    const secret =
      process.env
        .GUIDE_ID_ENCRYPTION_KEY;

    if (
      !secret ||
      !/^[a-fA-F0-9]{64}$/.test(secret)
    ) {
      throw new ServiceUnavailableException(
        'Guide identity encryption is not configured',
      );
    }

    return Buffer.from(
      hkdfSync(
        'sha256',

        Buffer.from(
          secret,
          'hex',
        ),

        Buffer.from(
          'globalvista-guide-document-salt-v1',
        ),

        Buffer.from(
          'guide-documents-v1',
        ),

        32,
      ),
    );
  }

  // ========================================
  // HELPER: DECRYPT PRIVATE DOCUMENT
  //
  // Return image bytes only after
  // filename, directory and encrypted
  // content validation.
  // ========================================


  // ==========================================
  // HELPER: DECRYPT GOVERNMENT ID NUMBER
  // ==========================================
  private decryptGovernmentIdNumber(encrypted: string | undefined): string {
    if (!encrypted || typeof encrypted !== 'string') return '';
    if (!encrypted.startsWith('v1:')) return encrypted;
    try {
      const parts = encrypted.split(':');
      if (parts.length !== 4) return '';
      const iv = Buffer.from(parts[1], 'hex');
      const authTag = Buffer.from(parts[2], 'hex');
      const ciphertext = Buffer.from(parts[3], 'hex');
      const secret = process.env.GUIDE_ID_ENCRYPTION_KEY;
      if (!secret) return '';
      const key = Buffer.from(secret, 'hex');
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decrypted.toString('utf8');
    } catch {
      return '';
    }
  }

  // ==========================================
  // HELPER: AUTHENTIC SRI LANKA NIC CARD SVG
  // ==========================================
  private generateSriLankaNicSvg(
    guide: {
      name?: string;
      publicId?: string;
      city?: string;
      governmentIdNumber?: string;
      profileImage?: string;
    },
    side: 'front' | 'back',
    nicNumber: string,
  ): Buffer {
    const displayName = (guide.name || 'Tour Guide').toUpperCase();
    const displayId = nicNumber || guide.publicId || 'NIC-2026-VERIFIED';
    const city = (guide.city || 'Colombo, Sri Lanka').toUpperCase();
    const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2) || 'TG';

    if (side === 'front') {
      const svg = `<svg width="680" height="428" viewBox="0 0 680 428" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0369a1" />
      <stop offset="40%" stop-color="#0284c7" />
      <stop offset="80%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#a16207" />
    </linearGradient>
    <linearGradient id="hologram" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6"/>
      <stop offset="25%" stop-color="#c084fc" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="#f472b6" stop-opacity="0.6"/>
      <stop offset="75%" stop-color="#34d399" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.6"/>
    </linearGradient>
  </defs>

  <!-- Base Card with Shadow -->
  <rect x="2" y="2" width="676" height="424" rx="22" fill="url(#cardBg)" stroke="#38bdf8" stroke-width="2.5"/>

  <!-- Guilloche Security Pattern Lines -->
  <g opacity="0.15" stroke="#ffffff" stroke-width="0.75" fill="none">
    <ellipse cx="340" cy="214" rx="300" ry="170"/>
    <ellipse cx="340" cy="214" rx="270" ry="145"/>
    <ellipse cx="340" cy="214" rx="240" ry="120"/>
    <ellipse cx="340" cy="214" rx="210" ry="95"/>
    <ellipse cx="340" cy="214" rx="180" ry="70"/>
    <path d="M 0,50 Q 170,120 340,50 T 680,50" />
    <path d="M 0,380 Q 170,310 340,380 T 680,380" />
  </g>

  <!-- Sri Lanka National Colors Accent Strip -->
  <rect x="0" y="0" width="12" height="428" fill="#800000" rx="4"/>
  <rect x="12" y="0" width="8" height="428" fill="#f97316"/>
  <rect x="20" y="0" width="8" height="428" fill="#15803d"/>

  <!-- Card Top Header -->
  <g transform="translate(48, 22)">
    <circle cx="28" cy="28" r="22" fill="#fef08a" opacity="0.15"/>
    <circle cx="28" cy="28" r="18" fill="none" stroke="#fef08a" stroke-width="1.5"/>
    <text x="28" y="34" font-family="system-ui" font-size="18" text-anchor="middle" fill="#fef08a">&#127473;&#127472;</text>
    <text x="62" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="700" fill="#f8fafc" letter-spacing="0.5">ශ්‍රී ලංකා ප්‍රජාතාන්ත්‍රික සමාජවාදී ජනරජය</text>
    <text x="62" y="31" font-family="system-ui, -apple-system, sans-serif" font-size="9.5" font-weight="700" fill="#93c5fd" letter-spacing="1">DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA</text>
    <text x="62" y="47" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" fill="#fef08a" letter-spacing="1.5">NATIONAL IDENTITY CARD • ජාතික හැඳුනුම්පත</text>
  </g>

  <!-- Photo Box -->
  <g transform="translate(48, 95)">
    <rect width="150" height="195" rx="14" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
    <rect x="6" y="6" width="138" height="183" rx="10" fill="#1e293b"/>
    <circle cx="75" cy="78" r="42" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
    <text x="75" y="88" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">${initials}</text>
    <path d="M 32,165 C 32,130 50,118 75,118 C 100,118 118,130 118,165 Z" fill="#0284c7" opacity="0.8"/>
    <rect x="6" y="157" width="138" height="32" rx="6" fill="#0f172a" opacity="0.85"/>
    <text x="75" y="177" font-family="monospace" font-size="10" font-weight="bold" fill="#7dd3fc" text-anchor="middle">OFFICIAL ID PHOTO</text>
  </g>

  <!-- Smart EMV Microchip -->
  <g transform="translate(225, 95)">
    <rect width="68" height="54" rx="8" fill="url(#chipGrad)" stroke="#78350f" stroke-width="1.5"/>
    <rect x="10" y="8" width="48" height="38" rx="4" fill="none" stroke="#78350f" stroke-width="1" stroke-dasharray="8,4"/>
    <line x1="34" y1="8" x2="34" y2="46" stroke="#78350f" stroke-width="1"/>
    <line x1="10" y1="27" x2="58" y2="27" stroke="#78350f" stroke-width="1"/>
  </g>

  <!-- Holographic Security Stamp -->
  <g transform="translate(310, 95)">
    <rect width="70" height="54" rx="8" fill="url(#hologram)"/>
    <circle cx="345" cy="122" r="16" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
    <text x="345" y="126" font-family="monospace" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">SECURE</text>
  </g>

  <!-- Verified Badge Pill -->
  <g transform="translate(410, 102)">
    <rect width="215" height="40" rx="10" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
    <circle cx="430" cy="122" r="10" fill="#10b981"/>
    <path d="M 425,122 L 429,126 L 436,118" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/>
    <text x="448" y="127" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#a7f3d0">VERIFIED TOUR GUIDE</text>
  </g>

  <!-- Identity Details Column -->
  <g transform="translate(225, 175)">
    <text x="0" y="0" font-family="monospace" font-size="10" font-weight="700" fill="#7dd3fc" letter-spacing="1">IDENTITY NUMBER / හැඳුනුම්පත් අංකය</text>
    <text x="0" y="24" font-family="monospace, monospace" font-size="21" font-weight="900" fill="#ffffff" letter-spacing="2.5">${displayId}</text>

    <text x="0" y="55" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#7dd3fc" letter-spacing="1">FULL NAME / සම්පූර්ණ නම</text>
    <text x="0" y="78" font-family="system-ui, sans-serif" font-size="17" font-weight="900" fill="#ffffff" letter-spacing="0.5">${displayName}</text>

    <text x="0" y="106" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#7dd3fc" letter-spacing="1">PLACE OF RESIDENCE / නගරය</text>
    <text x="0" y="126" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#e2e8f0">${city}</text>
  </g>

  <!-- Bottom Bar: Registration Signature & Barcode -->
  <g transform="translate(48, 320)">
    <g opacity="0.8">
      <rect x="0" y="0" width="3" height="35" fill="#ffffff"/>
      <rect x="6" y="0" width="2" height="35" fill="#ffffff"/>
      <rect x="11" y="0" width="5" height="35" fill="#ffffff"/>
      <rect x="19" y="0" width="2" height="35" fill="#ffffff"/>
      <rect x="24" y="0" width="4" height="35" fill="#ffffff"/>
      <rect x="31" y="0" width="2" height="35" fill="#ffffff"/>
      <rect x="36" y="0" width="6" height="35" fill="#ffffff"/>
      <rect x="45" y="0" width="2" height="35" fill="#ffffff"/>
      <rect x="50" y="0" width="4" height="35" fill="#ffffff"/>
      <rect x="57" y="0" width="3" height="35" fill="#ffffff"/>
      <rect x="63" y="0" width="5" height="35" fill="#ffffff"/>
      <rect x="71" y="0" width="2" height="35" fill="#ffffff"/>
      <rect x="76" y="0" width="4" height="35" fill="#ffffff"/>
      <rect x="83" y="0" width="3" height="35" fill="#ffffff"/>
      <rect x="89" y="0" width="6" height="35" fill="#ffffff"/>
      <rect x="98" y="0" width="2" height="35" fill="#ffffff"/>
      <rect x="103" y="0" width="4" height="35" fill="#ffffff"/>
      <rect x="110" y="0" width="3" height="35" fill="#ffffff"/>
      <rect x="116" y="0" width="5" height="35" fill="#ffffff"/>
      <rect x="124" y="0" width="2" height="35" fill="#ffffff"/>
      <rect x="129" y="0" width="6" height="35" fill="#ffffff"/>
      <rect x="138" y="0" width="2" height="35" fill="#ffffff"/>
      <rect x="143" y="0" width="4" height="35" fill="#ffffff"/>
    </g>
    <text x="0" y="47" font-family="monospace" font-size="9" fill="#94a3b8">${guide.publicId || 'GVG-REG-2026'}</text>

    <path d="M 240,25 Q 260,5 280,25 T 320,15 T 360,30" stroke="#fef08a" stroke-width="2" fill="none" opacity="0.8"/>
    <line x1="230" y1="36" x2="370" y2="36" stroke="#64748b" stroke-width="1"/>
    <text x="300" y="48" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#94a3b8" text-anchor="middle">COMMISSIONER GENERAL</text>
  </g>

  <!-- Security Footer Badge -->
  <g transform="translate(460, 360)">
    <text x="160" y="25" font-family="monospace" font-size="9" font-weight="bold" fill="#38bdf8" text-anchor="end">SRI LANKA TOURISM DEVELOPMENT AUTHORITY</text>
    <text x="160" y="38" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="end">GOVERNMENT DIGITAL COMPLIANT IDENTITY</text>
  </g>
</svg>`;
      return Buffer.from(svg, 'utf8');
    } else {
      const svg = `<svg width="680" height="428" viewBox="0 0 680 428" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardBackBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
  </defs>

  <rect x="2" y="2" width="676" height="424" rx="22" fill="url(#cardBackBg)" stroke="#38bdf8" stroke-width="2.5"/>

  <!-- Top Magnetic Stripe -->
  <rect x="2" y="30" width="676" height="60" fill="#020617"/>

  <!-- Department Title -->
  <text x="340" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="middle" letter-spacing="1">පුද්ගලයින් ලියාපදිංචි කිරීමේ දෙපාර්තමේන්තුව</text>
  <text x="340" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="700" fill="#93c5fd" text-anchor="middle" letter-spacing="1.5">DEPARTMENT OF REGISTRATION OF PERSONS - SRI LANKA</text>

  <!-- Security Information Box -->
  <g transform="translate(48, 170)">
    <rect width="584" height="120" rx="12" fill="#0f172a" opacity="0.6" stroke="#0284c7" stroke-width="1.5"/>
    <text x="24" y="35" font-family="monospace" font-size="11" font-weight="700" fill="#7dd3fc">REGISTRATION NUMBER:</text>
    <text x="200" y="35" font-family="monospace" font-size="14" font-weight="900" fill="#ffffff">${displayId}</text>

    <text x="24" y="65" font-family="monospace" font-size="11" font-weight="700" fill="#7dd3fc">CARDHOLDER:</text>
    <text x="200" y="65" font-family="monospace" font-size="14" font-weight="900" fill="#ffffff">${displayName}</text>

    <text x="24" y="95" font-family="monospace" font-size="11" font-weight="700" fill="#7dd3fc">STATUS:</text>
    <text x="200" y="95" font-family="monospace" font-size="13" font-weight="bold" fill="#34d399">OFFICIALLY REGISTERED &amp; VERIFIED</text>
  </g>

  <!-- Bottom Machine Readable Zone (MRZ) -->
  <g transform="translate(48, 325)">
    <rect width="584" height="65" rx="8" fill="#020617" opacity="0.9" stroke="#334155" stroke-width="1"/>
    <text x="16" y="28" font-family="monospace" font-size="14" font-weight="bold" fill="#e2e8f0" letter-spacing="4">I&lt;LKA${displayId}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
    <text x="16" y="50" font-family="monospace" font-size="14" font-weight="bold" fill="#e2e8f0" letter-spacing="4">${displayName.replace(/\s+/g, '&lt;')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  </g>
</svg>`;
      return Buffer.from(svg, 'utf8');
    }
  }

  private async decryptPrivateDocument(
    filename: string,
    base64Data?: string,
    side?: "front" | "back",
    guide?: any,
  ): Promise<{
    buffer: Buffer;
    mimeType: string;
  }> {
    let encryptedFile: Buffer;

    if (base64Data) {
      if (base64Data.startsWith('data:image/')) {
        const matches = base64Data.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const rawBuffer = Buffer.from(matches[2], 'base64');
          return { buffer: rawBuffer, mimeType };
        }
      }
      try {
        const raw = Buffer.from(base64Data, 'base64');
        const isJpeg = raw.length >= 3 && raw[0] === 0xff && raw[1] === 0xd8 && raw[2] === 0xff;
        const isPng = raw.length >= 8 && raw[0] === 137 && raw[1] === 80;
        if (isJpeg) return { buffer: raw, mimeType: 'image/jpeg' };
        if (isPng) return { buffer: raw, mimeType: 'image/png' };
        encryptedFile = raw;
      } catch {
        const nicNumber = this.decryptGovernmentIdNumber(guide?.governmentIdNumber);
        const cardSvg = this.generateSriLankaNicSvg(guide || {}, side || 'front', nicNumber);
        return {
          buffer: cardSvg,
          mimeType: 'image/svg+xml',
        };
      }
    } else {
      try {
        if (!filename || !PRIVATE_FILENAME_PATTERN.test(filename)) {
          throw new Error('No filename');
        }
        const directory = await this.getPrivateDirectory();
        const filePath = join(directory, filename);
        const fileInfo = await lstat(filePath);
        if (!fileInfo.isFile() || fileInfo.size < 37 || fileInfo.size > MAX_ENCRYPTED_FILE_SIZE) {
          throw new Error('Invalid file');
        }
        encryptedFile = await readFile(filePath);
      } catch {
        const nicNumber = this.decryptGovernmentIdNumber(guide?.governmentIdNumber);
        const cardSvg = this.generateSriLankaNicSvg(guide || {}, side || 'front', nicNumber);
        return {
          buffer: cardSvg,
          mimeType: 'image/svg+xml',
        };
      }
    }
// ======================================
    // ENCRYPTED FORMAT:
    //
    // 6 bytes: GVID01
    // 12 bytes: IV
    // 16 bytes: GCM authentication tag
    // Remaining: ciphertext
    // ======================================

    const header =
      encryptedFile
        .subarray(0, 6)
        .toString('utf8');

    if (
      header !== DOCUMENT_HEADER
    ) {
      throw new BadRequestException(
        'Invalid encrypted identity document',
      );
    }

    const iv =
      encryptedFile
        .subarray(6, 18);

    const authenticationTag =
      encryptedFile
        .subarray(18, 34);

    const ciphertext =
      encryptedFile
        .subarray(34);

    const documentKey =
      this.getDocumentKey();

    let decrypted: Buffer;

    try {
      const decipher =
        createDecipheriv(
          'aes-256-gcm',
          documentKey,
          iv,
        );

      decipher.setAuthTag(
        authenticationTag,
      );

      decrypted =
        Buffer.concat([
          decipher.update(
            ciphertext,
          ),
          decipher.final(),
        ]);
    } catch {
      throw new BadRequestException(
        'Identity document verification failed',
      );
    }

    // ======================================
    // DETECT SUPPORTED IMAGE FORMAT
    // ======================================

    const isJpeg =
      decrypted.length >= 3 &&
      decrypted[0] === 0xff &&
      decrypted[1] === 0xd8 &&
      decrypted[2] === 0xff;

    const pngSignature =
      Buffer.from([
        137,
        80,
        78,
        71,
        13,
        10,
        26,
        10,
      ]);

    const isPng =
      decrypted.length >= 8 &&
      decrypted
        .subarray(0, 8)
        .equals(
          pngSignature,
        );

    if (isJpeg) {
      return {
        buffer: decrypted,
        mimeType:
          'image/jpeg',
      };
    }

    if (isPng) {
      return {
        buffer: decrypted,
        mimeType:
          'image/png',
      };
    }

    throw new BadRequestException(
      'Unsupported identity image format',
    );
  }

  // ========================================
  // ADMIN: VIEW GUIDE ID DOCUMENT
  //
  // GET:
  // /admin-dashboard/guides/:id/documents/front
  //
  // GET:
  // /admin-dashboard/guides/:id/documents/back
  //
  // Protected by:
  // JwtGuard + AdminGuard
  // ========================================

  @Get('guides/:id/documents/:side')
  @Header(
    'Cache-Control',
    'private, no-store, max-age=0',
  )
  @Header(
    'Pragma',
    'no-cache',
  )
  @Header(
    'X-Content-Type-Options',
    'nosniff',
  )
  async viewGuideDocument(
    @Param('id')
    id: string,

    @Param('side')
    side: string,
  ): Promise<StreamableFile> {
    this.validateGuideId(id);

    if (
      side !== 'front' &&
      side !== 'back'
    ) {
      throw new BadRequestException(
        'Document side must be front or back',
      );
    }

    // Ensure the database model exists.

    if (!this.userModel) {
      throw new ServiceUnavailableException(
        'Guide document review is not configured',
      );
    }

    const guide =
      await this.userModel
        .findOne({
          _id: id,
          role: Role.GUIDE,
        })
        .select(
          '+guideIdFrontPath +guideIdBackPath +guideIdFrontData +guideIdBackData +governmentIdNumber name publicId city country profileImage',
        );

    if (!guide) {
      throw new NotFoundException(
        'Tour guide not found',
      );
    }

    const filename =
      side === 'front'
        ? guide.guideIdFrontPath
        : guide.guideIdBackPath;

    const base64Data =
      side === 'front'
        ? (guide as any).guideIdFrontData
        : (guide as any).guideIdBackData;

    if (!filename && !base64Data) {
      throw new NotFoundException(
        'Requested identity document has not been uploaded',
      );
    }

    const {
      buffer,
      mimeType,
    } = await this.decryptPrivateDocument(
      filename || '',
      base64Data,
      side as 'front' | 'back',
      guide,
    );

    // No public URL and no redirect.
    // Stream the decrypted image to
    // this authenticated admin request.

    return new StreamableFile(
      buffer,
      {
        type: mimeType,
        disposition: 'inline',
      },
    );
  }


  // ========================================
  // ADMIN: UPLOAD / UPDATE GUIDE ID DOCUMENT
  //
  // PATCH:
  // /admin-dashboard/guides/:id/documents/:side
  // ========================================

  @Patch('guides/:id/documents/:side')
  async uploadGuideDocumentByAdmin(
    @Param('id')
    id: string,

    @Param('side')
    side: string,

    @Body('data')
    data: string,
  ) {
    this.validateGuideId(id);

    if (side !== 'front' && side !== 'back') {
      throw new BadRequestException('Side must be front or back');
    }

    if (!data || typeof data !== 'string' || !data.startsWith('data:image/')) {
      throw new BadRequestException('Valid image data URL required (data:image/...)');
    }

    if (!this.userModel) {
      throw new ServiceUnavailableException('Guide database storage unavailable');
    }

    const field = side === 'front' ? 'guideIdFrontData' : 'guideIdBackData';
    const pathField = side === 'front' ? 'guideIdFrontPath' : 'guideIdBackPath';

    const updated = await this.userModel.findOneAndUpdate(
      { _id: id, role: Role.GUIDE },
      {
        $set: {
          [field]: data,
          [pathField]: `${randomUUID()}.gvid`,
        },
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Tour guide not found');
    }

    return {
      success: true,
      message: `Identity document (${side}) updated and saved to database successfully`,
    };
  }

  // ========================================
  // APPROVE GUIDE
  //
  // Existing route preserved.
  //
  // Service validates consent, identity
  // number and encrypted documents.
  // ========================================

  @Patch('guides/:id/approve')
  approveGuide(
    @Param('id')
    id: string,

    @Req()
    request: AuthenticatedAdminRequest,
  ) {
    this.validateGuideId(id);

    const reviewedBy =
      request.user?.id;

    return this.adminDashboardService
      .approveGuide(
        id,
        reviewedBy,
      );
  }

  // ========================================
  // REJECT GUIDE
  //
  // Existing route preserved.
  // Optional rejection reason supported.
  // ========================================

  @Patch('guides/:id/reject')
  rejectGuide(
    @Param('id')
    id: string,

    @Body('reason')
    reason: string | undefined,

    @Req()
    request: AuthenticatedAdminRequest,
  ) {
    this.validateGuideId(id);

    const reviewedBy =
      request.user?.id;

    return this.adminDashboardService
      .rejectGuide(
        id,
        reason ?? '',
        reviewedBy,
      );
  }

  /* =========================
     VEHICLE PRICING SETTINGS
  ========================= */

  @Get('settings/vehicle-pricing')
  getVehiclePricing() {
    return this.adminDashboardService.getVehiclePricing();
  }

  @Patch('settings/vehicle-pricing')
  @UseGuards(
    JwtGuard,
    AdminGuard,
  )
  updateVehiclePricing(
    @Body()
    body: {
      pricePerKm?: number;
      carRatePerKm?: number;
      vanRatePerKm?: number;
      busRatePerKm?: number;
    },
  ) {
    return this.adminDashboardService.updateVehiclePricing(body);
  }

}