# Styling Analysis: RSVP Modal vs Spotify Combobox

## Visual Consistency Issues Identified

### 1. Dropdown Container Styling
**Current (Light Theme):**
```css
class="bg-white/95 backdrop-blur-sm border border-purple-200 rounded-lg shadow-lg"
style="background: rgba(255,255,255,0.95);"
```

**Should Match RSVP Modal Pattern:**
```css
background: rgba(255,255,255,0.06);  /* Same as input fields */
border: 2px solid hsl(270, 30%, 40%); /* Same as input fields */
```

### 2. Result Item Hover States
**Current (Light Theme):**
```css
class="hover:bg-purple-50"
```

**Should Match Modal Hover Pattern:**
```css
class="hover:bg-white/5"  /* Same as radio button labels */
```

### 3. Album Art Placeholder
**Current (Light Theme):**
```css
class="bg-purple-100 text-purple-400"
```

**Should Match Dark Theme:**
```css
class="bg-white/10 text-warm-cream/50"
```

### 4. Border and Focus Integration
**Current Dropdown:**
- Uses `border-purple-200` (light)
- No focus integration with parent input

**Should Match Modal:**
- Use `hsl(270, 30%, 40%)` for consistency
- Integrate with input focus state

## Color Palette Analysis

### RSVP Modal Theme Colors
- **Background**: `rgba(255,255,255,0.06)` (translucent white)
- **Border Default**: `hsl(270, 30%, 40%)` (muted purple)
- **Border Focus**: `#FFB6D9` (pink accent)
- **Text Primary**: `text-warm-cream`
- **Text Secondary**: `text-metallic-silver/70`
- **Hover**: `hover:bg-white/5`

### Current Combobox Issues
- **Dropdown**: Light white background (95% opacity)
- **Items**: Light purple hover states
- **Placeholder**: Light purple colors
- **Border**: Different purple tone

## Visual Hierarchy Problems

### 1. Contrast Issues
The light dropdown doesn't provide proper contrast against the dark background, making it appear disconnected from the form.

### 2. Color Temperature Mismatch
The warm color palette (warm-cream, metallic-silver) clashes with cool purples used in the dropdown.

### 3. Depth Perception
The dropdown appears to "float" rather than being integrated with the form due to styling disconnect.

## Recommended Styling Approach

### 1. Consistent Container
- Use same background pattern as inputs
- Use same border styling and colors
- Integrate with focus states

### 2. Unified Item Styling
- Match hover states with other interactive elements
- Use consistent color palette
- Maintain proper contrast ratios

### 3. Seamless Integration
- Ensure dropdown feels like part of the form
- Maintain visual flow and hierarchy
- Preserve accessibility while improving aesthetics