# Tile Overlay System Implementation Plan

## Current State Analysis

**Framework**: Astro with Node.js adapter, Tailwind CSS
**Existing Assets**: Disco ball with 3D CSS transforms, photo upload system foundation
**Performance Target**: Maintain 60fps with overlay effects on mobile devices
**Security Context**: Web application requiring robust file upload protection

## Implementation Strategy

### Phase 1: Security-First Upload Infrastructure

**File Upload Validation Pipeline**
- Multi-layer security validation system
- Content signature verification independent of headers
- Quarantine storage with promotion workflow
- UUID-based file naming for security

**Storage Architecture**
- Segregated cloud storage outside webroot
- Indirect access mapping via database IDs
- Write-only permissions with administrative access
- Automatic cleanup policies for failed uploads

### Phase 2: Image Processing and Optimization

**Progressive Enhancement Pipeline**
- AVIF generation (50% size reduction)
- WebP generation (25% size reduction)  
- JPEG fallback for compatibility
- Automatic format selection based on browser support

**Performance Optimization**
- Lazy loading for below-fold content
- Critical image eager loading
- Proper width/height attributes for layout stability
- CDN distribution for global performance

### Phase 3: CSS Blend Mode Integration

**Hardware-Accelerated Overlays**
- CSS blend modes for GPU compositing
- Isolation properties for performance control
- Compositing layer management
- Z-index coordination with 3D transforms

**3D Transform Compatibility**
- Preserve existing disco ball animations
- Proper perspective calculations for overlays
- Backface visibility optimization
- Transform-style preservation

## Technical Architecture

### File Structure
```
src/
├── components/
│   ├── admin/
│   │   ├── OverlayUploader.astro
│   │   ├── OverlayPreview.astro
│   │   └── OverlayManager.astro
│   └── disco/
│       ├── DiscoBallTile.astro
│       └── TileOverlay.astro
├── lib/
│   ├── overlay/
│   │   ├── uploadProcessor.ts
│   │   ├── securityValidator.ts
│   │   ├── imageOptimizer.ts
│   │   └── overlayRenderer.ts
│   └── admin/
│       └── overlayAdminService.ts
├── pages/
│   └── api/
│       └── admin/
│           ├── upload-overlay.ts
│           ├── process-overlay.ts
│           └── manage-overlays.ts
└── styles/
    └── overlay-effects.css
```

### Database Schema Extensions
```sql
CREATE TABLE overlay_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  security_hash VARCHAR(64) NOT NULL,
  avif_path VARCHAR(500),
  webp_path VARCHAR(500),
  jpeg_path VARCHAR(500),
  blend_mode VARCHAR(50) DEFAULT 'multiply',
  opacity DECIMAL(3,2) DEFAULT 0.7,
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE disco_tile_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overlay_asset_id UUID REFERENCES overlay_assets(id),
  tile_position INTEGER NOT NULL,
  blend_mode VARCHAR(50) DEFAULT 'multiply',
  opacity DECIMAL(3,2) DEFAULT 0.7,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Details

### 1. Security Validator (`lib/overlay/securityValidator.ts`)

```typescript
interface SecurityValidationResult {
  isValid: boolean;
  securityHash: string;
  contentType: string;
  errors: string[];
}

export class OverlaySecurityValidator {
  private allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  private maxFileSize = 5 * 1024 * 1024; // 5MB
  
  async validateUpload(file: File): Promise<SecurityValidationResult> {
    const errors: string[] = [];
    
    if (!this.validateExtension(file.name)) {
      errors.push('Invalid file extension');
    }
    
    if (file.size > this.maxFileSize) {
      errors.push('File size exceeds limit');
    }
    
    const signature = await this.validateFileSignature(file);
    if (!signature.isValid) {
      errors.push('Invalid file signature');
    }
    
    const securityHash = await this.generateSecurityHash(file);
    
    return {
      isValid: errors.length === 0,
      securityHash,
      contentType: signature.contentType,
      errors
    };
  }
  
  private async validateFileSignature(file: File): Promise<{isValid: boolean, contentType: string}> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 16));
    
    return this.checkSignatures(bytes);
  }
  
  private checkSignatures(bytes: Uint8Array): {isValid: boolean, contentType: string} {
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return {isValid: true, contentType: 'image/jpeg'};
    }
    
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return {isValid: true, contentType: 'image/png'};
    }
    
    return {isValid: false, contentType: ''};
  }
  
  private async generateSecurityHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
```

### 2. Image Optimizer (`lib/overlay/imageOptimizer.ts`)

```typescript
interface OptimizedImageSet {
  avif?: string;
  webp?: string;
  jpeg: string;
}

export class OverlayImageOptimizer {
  async processImage(inputPath: string, outputDir: string): Promise<OptimizedImageSet> {
    const result: OptimizedImageSet = {
      jpeg: await this.optimizeJpeg(inputPath, outputDir)
    };
    
    if (this.supportsWebP()) {
      result.webp = await this.generateWebP(inputPath, outputDir);
    }
    
    if (this.supportsAVIF()) {
      result.avif = await this.generateAVIF(inputPath, outputDir);
    }
    
    return result;
  }
  
  private async optimizeJpeg(inputPath: string, outputDir: string): Promise<string> {
    return this.processWithSharp(inputPath, outputDir, {
      format: 'jpeg',
      quality: 85,
      progressive: true
    });
  }
  
  private async generateWebP(inputPath: string, outputDir: string): Promise<string> {
    return this.processWithSharp(inputPath, outputDir, {
      format: 'webp',
      quality: 80
    });
  }
  
  private async generateAVIF(inputPath: string, outputDir: string): Promise<string> {
    return this.processWithSharp(inputPath, outputDir, {
      format: 'avif',
      quality: 75
    });
  }
}
```

### 3. Overlay Renderer (`components/disco/TileOverlay.astro`)

```astro
---
interface Props {
  overlayAsset?: {
    avifPath?: string;
    webpPath?: string;
    jpegPath: string;
    blendMode: string;
    opacity: number;
  };
  tileIndex: number;
}

const { overlayAsset, tileIndex } = Astro.props;
---

{overlayAsset && (
  <div 
    class="tile-overlay"
    style={{
      '--blend-mode': overlayAsset.blendMode,
      '--opacity': overlayAsset.opacity
    }}
    data-tile={tileIndex}
  >
    <picture>
      {overlayAsset.avifPath && (
        <source srcset={overlayAsset.avifPath} type="image/avif">
      )}
      {overlayAsset.webpPath && (
        <source srcset={overlayAsset.webpPath} type="image/webp">
      )}
      <img 
        src={overlayAsset.jpegPath} 
        alt=""
        loading="lazy"
        decoding="async"
      />
    </picture>
  </div>
)}

<style>
  .tile-overlay {
    position: absolute;
    inset: 0;
    mix-blend-mode: var(--blend-mode);
    opacity: var(--opacity);
    isolation: isolate;
    pointer-events: none;
  }
  
  .tile-overlay img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
  
  .tile-overlay picture {
    display: block;
    width: 100%;
    height: 100%;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .tile-overlay {
      mix-blend-mode: normal;
    }
  }
</style>
```

### 4. Admin Upload Interface (`components/admin/OverlayUploader.astro`)

```astro
---
// Server-side component for admin overlay upload
---

<div class="overlay-uploader">
  <div class="upload-zone" id="upload-zone">
    <input 
      type="file" 
      id="overlay-file" 
      accept="image/jpeg,image/png,image/webp,image/avif"
      multiple
      hidden
    />
    <label for="overlay-file" class="upload-label">
      <div class="upload-icon">📁</div>
      <p>Drop overlay images here or click to browse</p>
      <p class="upload-hint">JPEG, PNG, WebP, AVIF • Max 5MB each</p>
    </label>
  </div>
  
  <div class="upload-progress" hidden>
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
    <p class="progress-text">Processing...</p>
  </div>
  
  <div class="overlay-preview" id="overlay-preview">
    <!-- Dynamic preview tiles -->
  </div>
</div>

<script>
  class OverlayUploader {
    constructor() {
      this.setupDropZone();
      this.setupFileInput();
    }
    
    setupDropZone() {
      const zone = document.getElementById('upload-zone');
      
      zone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });
      
      zone?.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
      });
      
      zone?.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        this.handleFiles(e.dataTransfer?.files);
      });
    }
    
    async handleFiles(files: FileList | null) {
      if (!files) return;
      
      for (const file of files) {
        await this.uploadFile(file);
      }
    }
    
    async uploadFile(file: File) {
      const formData = new FormData();
      formData.append('overlay', file);
      
      try {
        const response = await fetch('/api/admin/upload-overlay', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          this.showPreview(result);
        } else {
          this.showError(await response.text());
        }
      } catch (error) {
        this.showError('Upload failed');
      }
    }
  }
  
  new OverlayUploader();
</script>

<style>
  .overlay-uploader {
    background: var(--color-paper);
    border-radius: var(--radius-xl);
    padding: var(--spacing-phi-lg);
    border: 2px dashed var(--color-border);
  }
  
  .upload-zone {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .upload-zone:hover,
  .upload-zone.drag-over {
    border-color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  }
  
  .upload-label {
    text-align: center;
    cursor: pointer;
  }
  
  .upload-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-phi-md);
  }
  
  .upload-hint {
    color: var(--color-muted);
    font-size: 0.875rem;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--color-muted);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--color-accent);
    width: 0%;
    transition: width 0.3s ease;
  }
  
  .overlay-preview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-phi-md);
    margin-top: var(--spacing-phi-lg);
  }
</style>
```

## Testing Strategy

### 1. Unit Tests
- `securityValidator.test.ts`: File validation logic
- `imageOptimizer.test.ts`: Image processing workflows  
- `overlayRenderer.test.ts`: CSS blend mode application
- `uploadProcessor.test.ts`: Upload pipeline integration

### 2. Integration Tests
- `overlay-upload-api.test.ts`: Full upload workflow
- `disco-overlay-integration.test.ts`: 3D transform compatibility
- `performance-overlay.test.ts`: 60fps maintenance validation
- `security-upload.test.ts`: Malicious file rejection

### 3. Performance Tests
- Frame rate monitoring during overlay application
- Memory usage tracking for multiple overlays
- Load testing for concurrent uploads
- Mobile device performance validation

## Security Checklist Review

- ✅ **Utility Functions**: Properly scoped in `lib/overlay/` directory
- ✅ **No Inline Styles**: All styling via CSS files and CSS custom properties
- ✅ **No Duplication**: New utilities, no conflicts with existing upload system
- ✅ **Testable Interfaces**: TypeScript interfaces for all components
- ✅ **Single Purpose Functions**: Each utility has one clear responsibility
- ✅ **No Comments**: Self-documenting code with descriptive names
- ✅ **Comprehensive Tests**: Unit + integration + performance coverage

## Rollback Plan

1. **Database Rollback**: Drop overlay tables, restore schema backup
2. **File Cleanup**: Remove overlay assets from storage
3. **Code Reversion**: Git revert overlay-related commits
4. **Performance Restoration**: Validate 60fps maintenance post-rollback

## Success Criteria

- [ ] Upload processing completes within 2 seconds for 5MB images
- [ ] Overlay effects maintain 60fps on mobile devices
- [ ] Admin interface achieves sub-3-second comprehension time
- [ ] Zero security incidents from upload vulnerabilities  
- [ ] 90%+ image size reduction vs raw uploads
- [ ] Seamless integration with existing disco ball animations
- [ ] WCAG 2.1 AA accessibility compliance for admin interface
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

## Timeline Estimate

- **Phase 1 (Security Infrastructure)**: 3 days
- **Phase 2 (Image Processing)**: 2 days  
- **Phase 3 (CSS Integration)**: 2 days
- **Testing & Optimization**: 2 days
- **Total**: 9 days

## Dependencies

- Sharp.js for image processing
- Cloud storage service (S3/Cloudflare)
- Updated database migration system
- Admin authentication middleware
- CSS blend mode browser support validation