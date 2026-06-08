# Spotify Combobox Styling Fix

## Problem Statement

The Spotify combobox functionality is working on localhost, but there are styling inconsistencies between the RSVP modal form elements and the combobox component that need to be identified and resolved for visual coherence.

## Current State Analysis

### RSVP Modal Styling Pattern
**Input Fields:**
- Background: `rgba(255,255,255,0.06)`
- Border: `2px solid hsl(270, 30%, 40%)`
- Focus border: `#FFB6D9`
- Text: `text-warm-cream`
- Padding: `px-phi-md py-phi-sm`
- Border radius: `rounded-lg`
- Font size: `text-phi-base`

**Labels:**
- Style: `text-phi-sm font-medium text-warm-cream mb-2`
- Layout: `block`

**Interactive States:**
- Focus: Border changes to `#FFB6D9`
- Blur: Border reverts to `hsl(270, 30%, 40%)`
- Transitions: `transition-colors`

### Current Combobox Styling
**Static Fallback Select:**
- Uses identical styling to RSVP modal inputs
- Consistent background, border, and focus states

**Dynamic Search Input:**
- Uses identical styling to RSVP modal inputs
- Consistent with form patterns

**Results Dropdown:**
- Background: `rgba(255,255,255,0.95)` with `backdrop-blur-sm`
- Border: `border-purple-200`
- Shadow: `shadow-lg`
- Z-index: `z-50`
- Max height: `max-h-80` with `overflow-y-auto`

## Potential Styling Issues

### 1. Results Dropdown Theme Mismatch
The dropdown uses light styling (`bg-white/95`, `border-purple-200`) while the overall theme is dark with warm colors.

### 2. Missing Visual Integration
The dropdown might not integrate visually with the dark theme and warm color palette.

### 3. Result Item Styling
Individual search results may lack proper styling to match the overall theme.

### 4. Spacing and Layout
Potential inconsistencies in spacing patterns compared to other form elements.

## Success Criteria

- Combobox visually matches RSVP modal form elements
- Dropdown integrates seamlessly with dark theme
- Result items follow consistent styling patterns
- Focus states and interactions feel cohesive
- Overall user experience is visually unified