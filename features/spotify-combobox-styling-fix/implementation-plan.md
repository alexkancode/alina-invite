# Implementation Plan: Spotify Combobox Styling Fix

## Phase 1: Dropdown Container Styling Update

### 1.1 Update MusicSearchWidgetDynamic.astro
**Target:** Lines 84-87 in the dropdown container

**Current:**
```html
class="spotify-results-dropdown absolute top-full left-0 right-0 z-50 mt-1
       bg-white/95 backdrop-blur-sm border border-purple-200 rounded-lg
       shadow-lg max-h-80 overflow-y-auto hidden"
style="background: rgba(255,255,255,0.95);"
```

**Fix:**
```html
class="spotify-results-dropdown absolute top-full left-0 right-0 z-50 mt-1
       backdrop-blur-sm rounded-lg shadow-lg max-h-80 overflow-y-auto hidden"
style="background: rgba(255,255,255,0.06);
       border: 2px solid hsl(270, 30%, 40%);"
```

### 1.2 Add Focus Integration
- Ensure dropdown border matches input focus state
- Coordinate with parent input styling

## Phase 2: Result Item Styling Updates

### 2.1 Update SpotifyCombobox.ts createResultItem method
**Target:** Line 258 - Main result item container

**Current:**
```javascript
<div class="spotify-result-content flex items-center gap-3 p-3 cursor-pointer hover:bg-purple-50">
```

**Fix:**
```javascript
<div class="spotify-result-content flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors">
```

### 2.2 Update Album Art Placeholder
**Target:** Lines 267-268

**Current:**
```javascript
<div class="w-12 h-12 rounded bg-purple-100 flex items-center justify-center text-purple-400">🎵</div>
```

**Fix:**
```javascript
<div class="w-12 h-12 rounded bg-white/10 flex items-center justify-center text-warm-cream/50">🎵</div>
```

### 2.3 Enhanced Highlighted State
**Target:** Add proper highlighting for keyboard navigation

**Add:**
```css
.spotify-result-highlighted .spotify-result-content {
  background: rgba(255, 182, 217, 0.1); /* FFB6D9 with low opacity */
  border-left: 3px solid #FFB6D9;
}
```

## Phase 3: Typography and Spacing Consistency

### 3.1 Verify Text Styling Consistency
- Ensure `text-warm-cream` is used consistently
- Verify `text-metallic-silver/70` for secondary text
- Check font sizes match form patterns

### 3.2 Spacing Harmonization
- Verify padding matches other form elements (`p-3` → `px-phi-md py-phi-sm`)
- Ensure gap spacing is consistent (`gap-3` → `gap-phi-md`)

## Phase 4: Interactive States Enhancement

### 4.1 Button Styling Consistency
**Target:** Spotify play/open buttons (lines 283, 293)

**Current:**
```javascript
class="spotify-play-button w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
```

**Consider Update to Match Theme:**
```javascript
class="spotify-play-button w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors border border-green-400"
```

### 4.2 Focus Management
- Ensure keyboard navigation highlights are visible
- Maintain accessibility while improving visual design

## Phase 5: CSS Custom Properties (Optional Enhancement)

### 5.1 Extract Color Variables
Create consistent color variables for:
- `--combobox-bg: rgba(255,255,255,0.06)`
- `--combobox-border: hsl(270, 30%, 40%)`
- `--combobox-border-focus: #FFB6D9`
- `--combobox-hover: rgba(255,255,255,0.05)`
- `--combobox-text-primary: var(--warm-cream)`
- `--combobox-text-secondary: var(--metallic-silver-70)`

### 5.2 Theme Integration
- Ensure variables align with existing design system
- Maintain consistency with phi spacing and color scales

## Implementation Quality Checklist

### Code Organization
- [ ] No inline styles where CSS classes would be better
- [ ] Consistent naming conventions for new classes
- [ ] No duplication of existing utility classes
- [ ] Proper separation of component and styling concerns

### Visual Consistency
- [ ] Dropdown matches input field styling exactly
- [ ] Hover states match other interactive elements
- [ ] Color palette is consistent throughout
- [ ] Typography follows established patterns

### Accessibility
- [ ] High contrast ratios maintained
- [ ] Focus indicators are clearly visible
- [ ] Color changes don't rely solely on color for meaning
- [ ] Keyboard navigation remains functional

### Testing
- [ ] Visual regression testing with screenshots
- [ ] Cross-browser compatibility verification
- [ ] Dark mode and theme consistency
- [ ] Interactive state testing (hover, focus, active)

## Success Metrics

1. **Visual Harmony**: Combobox appears as seamless part of RSVP form
2. **User Experience**: No jarring visual transitions or inconsistencies
3. **Accessibility**: All WCAG guidelines maintained or improved
4. **Performance**: No impact on interaction responsiveness
5. **Maintainability**: Clear, consistent styling patterns