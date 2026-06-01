export interface SecurityValidationResult {
  isValid: boolean;
  securityHash: string;
  contentType: string;
  errors: string[];
}

export class OverlaySecurityValidator {
  private allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
  private maxFileSize = 5 * 1024 * 1024; // 5MB

  validateExtension(filename: string): boolean {
    const ext = this.getFileExtension(filename);
    return this.allowedExtensions.includes(ext);
  }

  validateFileSize(size: number): boolean {
    return size > 0 && size <= this.maxFileSize;
  }

  async validateFileSignature(bytes: Uint8Array): Promise<{isValid: boolean, contentType: string}> {
    if (this.isJPEG(bytes)) {
      return {isValid: true, contentType: 'image/jpeg'};
    }

    if (this.isPNG(bytes)) {
      return {isValid: true, contentType: 'image/png'};
    }

    if (this.isWebP(bytes)) {
      return {isValid: true, contentType: 'image/webp'};
    }

    if (this.isAVIF(bytes)) {
      return {isValid: true, contentType: 'image/avif'};
    }

    return {isValid: false, contentType: ''};
  }

  async generateSecurityHash(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async validateUpload(file: File): Promise<SecurityValidationResult> {
    const errors: string[] = [];

    if (!this.validateExtension(file.name)) {
      errors.push('Invalid file extension');
    }

    if (!this.validateFileSize(file.size)) {
      errors.push('File size exceeds limit');
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const signature = await this.validateFileSignature(bytes);
    if (!signature.isValid) {
      errors.push('Invalid file signature');
    }

    const securityHash = await this.generateSecurityHash(bytes);

    return {
      isValid: errors.length === 0,
      securityHash,
      contentType: signature.contentType,
      errors
    };
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.substring(lastDot).toLowerCase();
  }

  private isJPEG(bytes: Uint8Array): boolean {
    return bytes.length >= 3 &&
           bytes[0] === 0xFF &&
           bytes[1] === 0xD8 &&
           bytes[2] === 0xFF;
  }

  private isPNG(bytes: Uint8Array): boolean {
    return bytes.length >= 8 &&
           bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
           bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A;
  }

  private isWebP(bytes: Uint8Array): boolean {
    return bytes.length >= 12 &&
           bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
           bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }

  private isAVIF(bytes: Uint8Array): boolean {
    return bytes.length >= 12 &&
           bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70 &&
           bytes[8] === 0x61 && bytes[9] === 0x76 && bytes[10] === 0x69 && bytes[11] === 0x66;
  }
}