import { access, constants } from 'fs/promises';
import path from 'path';

export interface OptimizationMetrics {
  originalSize: number;
  jpegSize: number;
  webpSize: number;
  avifSize: number;
  processingTime: number;
}

export interface OptimizationTargets {
  original: number;
  jpeg: number;
  webp: number;
  avif: number;
}

export interface ProcessingPipeline {
  steps: string[];
  outputPaths: Record<string, string>;
}

export interface ImageConfig {
  quality: number;
  progressive?: boolean;
}

export class OverlayImageOptimizer {
  private jpegConfig: ImageConfig = {
    quality: 85,
    progressive: true
  };

  private webpConfig: ImageConfig = {
    quality: 80
  };

  private avifConfig: ImageConfig = {
    quality: 75
  };

  supportsWebP(): boolean {
    return true;
  }

  supportsAVIF(): boolean {
    return true;
  }

  getJpegConfig(): ImageConfig {
    return { ...this.jpegConfig };
  }

  getWebPConfig(): ImageConfig {
    return { ...this.webpConfig };
  }

  getAVIFConfig(): ImageConfig {
    return { ...this.avifConfig };
  }

  generateOutputPath(inputPath: string, outputDir: string, format: string): string {
    const basename = path.basename(inputPath, path.extname(inputPath));
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9-_]/g, '-');
    const timestamp = Date.now();
    return path.join(outputDir, `${sanitizedBasename}-${timestamp}.${format}`);
  }

  getOptimizationTargets(): OptimizationTargets {
    return {
      original: 1.0,
      jpeg: 0.85,
      webp: 0.65,
      avif: 0.50
    };
  }

  calculateSizeReductions(originalSize: number): { webp: number; avif: number } {
    const targets = this.getOptimizationTargets();
    return {
      webp: Math.floor(originalSize * targets.webp),
      avif: Math.floor(originalSize * targets.avif)
    };
  }

  async createProcessingPipeline(inputPath: string, outputDir: string): Promise<ProcessingPipeline> {
    await this.validateInputFile(inputPath);
    await this.validateOutputDirectory(outputDir);

    const steps: string[] = ['jpeg'];
    const outputPaths: Record<string, string> = {
      jpeg: this.generateOutputPath(inputPath, outputDir, 'jpg')
    };

    if (this.supportsWebP()) {
      steps.push('webp');
      outputPaths.webp = this.generateOutputPath(inputPath, outputDir, 'webp');
    }

    if (this.supportsAVIF()) {
      steps.push('avif');
      outputPaths.avif = this.generateOutputPath(inputPath, outputDir, 'avif');
    }

    return { steps, outputPaths };
  }

  calculateQualityScore(metrics: OptimizationMetrics): number {
    const sizeReduction = 1 - (metrics.avifSize / metrics.originalSize);
    const timeScore = Math.max(0, 100 - (metrics.processingTime / 50));

    const baseScore = sizeReduction * 60;
    const timePenalty = timeScore * 0.4;

    return Math.min(100, Math.max(0, baseScore + timePenalty));
  }

  private async validateInputFile(inputPath: string): Promise<void> {
    try {
      await access(inputPath, constants.R_OK);
    } catch {
      throw new Error(`Input file not accessible: ${inputPath}`);
    }
  }

  private async validateOutputDirectory(outputDir: string): Promise<void> {
    try {
      await access(outputDir, constants.W_OK);
    } catch {
      throw new Error(`Output directory not writable: ${outputDir}`);
    }
  }
}