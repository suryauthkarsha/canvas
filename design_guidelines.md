# Design Guidelines: AI Presentation Generator

## Design Approach

**System-Based with Creative Flourishes**: This productivity tool combines the efficiency of modern design systems (Linear, Notion) with the creative energy appropriate for a presentation design application. The interface should feel professional yet inspiring, minimalist yet capable.

**References**: Draw inspiration from Linear (clean, focused productivity), Figma (creative tools), and Gamma.app (AI presentation tools) for the interface chrome surrounding the presentation canvas.

---

## Typography System

**Font Families** (Already defined in code):
- **Space Grotesk**: Headers, UI labels, navigation (weights: 500-700)
- **Urbanist**: Body text, descriptions, input fields (weights: 400-600)

**Type Scale**:
- Hero/Page Title: text-4xl font-space font-bold
- Section Headers: text-xl font-space font-semibold
- UI Labels: text-sm font-space font-medium uppercase tracking-wide
- Body Text: text-base font-urbanist
- Helper Text: text-sm font-urbanist
- Small Labels: text-xs font-urbanist

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistent rhythm
- Micro spacing (icons, badges): p-2, gap-2
- Component padding: p-4, p-6
- Section spacing: py-8, py-12
- Large gaps: gap-8, gap-12

**Grid Structure**:
- App uses full viewport: `h-screen overflow-hidden`
- Header bar: Fixed height h-16
- Main canvas area: `flex-1` (takes remaining space)
- Side panels (if needed): w-80 with border separators

---

## Core Layout Sections

### Header Bar (Top Navigation)
**Structure**: Full-width sticky bar, flex justify-between items-center
- Left: Logo/branding + theme switcher
- Center: Generation status indicator (when active)
- Right: View mode toggle + Export button

**Elements**:
- Logo area: Combine Sparkles icon + "DeckForge" text-lg font-space font-bold
- Theme switcher: Horizontal pill group with 3 options (compact, single-select)
- View mode toggle: Icon buttons (Monitor for canvas, Layers for stack)
- Export button: Primary action, right-aligned with Download icon

### Input Section (When No Deck)
**Layout**: Centered modal-style container, max-w-2xl
- Title: text-3xl font-space font-bold mb-2
- Subtitle/description: text-lg mb-8
- Input group: Textarea + button combo
- Feature hints: Grid of 3 columns showing layout capabilities

**Textarea Styling**:
- min-h-32 rounded-lg border-2
- p-4 text-base font-urbanist
- Placeholder with suggestions: "Describe your presentation..."
- Focus state: ring-2 ring-offset-2

**Generate Button**:
- Large primary button w-full md:w-auto px-8 py-4
- text-base font-space font-semibold
- rounded-lg with Send icon
- Loading state: Loader2 icon spin animation

### Canvas View (Main Presentation Area)
**Structure**: Central presentation display with controls
- Slide container: max-w-6xl mx-auto with 16:9 aspect ratio
- Navigation: Floating controls at bottom (previous/next)
- Slide counter: Small indicator "3/10" top-right of canvas
- Progress bar: Thin line at top showing position in deck

**Slide Container**:
- Maintain 16:9 aspect ratio with proper scaling
- Drop shadow: shadow-2xl for depth
- Rounded corners: rounded-xl
- Transform on drag with smooth transition-transform duration-300

**Navigation Controls**:
- Floating button group at bottom-center
- ChevronLeft/ChevronRight icons in circular buttons
- w-12 h-12 rounded-full
- Positioned with fixed bottom-8
- Include keyboard hint badges (← →)

### Stack View (Alternative Layout)
**Structure**: Vertical scrollable list of slide thumbnails
- Grid: grid-cols-1 md:grid-cols-2 gap-6 p-8
- Each thumbnail: Clickable card with hover lift effect
- Active slide: Ring border to indicate current

**Thumbnail Cards**:
- Aspect ratio preserved, smaller scale (1/3 of canvas size)
- Slide number badge: Absolute top-left
- Hover state: -translate-y-1 shadow-lg transition-all

---

## Component Library

### Input Fields & Textareas
- Consistent border-2 rounded-lg
- Padding: p-4 for textarea, px-4 py-2 for inputs
- Focus: Remove default outline, add ring-2 ring-offset-2

### Buttons
**Primary Action** (Generate, Export):
- px-6 py-3 rounded-lg font-space font-semibold
- Icon + text combination with gap-2
- Loading state: disabled opacity-50 with spinning icon

**Secondary Action** (Theme switch, View toggle):
- px-4 py-2 rounded-md
- Active state: Different styling to show selection
- Group siblings with gap-2

**Icon Buttons**:
- w-10 h-10 rounded-full for navigation
- w-8 h-8 rounded-md for compact controls
- Flex center: flex items-center justify-center

### Status Indicators
**Generating State**:
- Floating card in center with backdrop-blur
- Loader2 icon with spin animation
- Text: "Generating your presentation..." with ellipsis animation
- Progress: Optional subtle progress bar

**Success Messages**:
- CheckCircle2 icon with fade-in animation
- Brief toast notification, auto-dismiss after 3s

---

## Slide Layout Components (Within Canvas)

Each theme renders differently, but maintain consistent spacing:
- Slide padding: p-12 for desktop, p-8 for mobile
- Title area: mb-8 from content
- Content spacing: gap-6 between elements

**Title Slide**:
- Centered content with accent line decoration
- Title: Dominant size, bold
- Subtitle: Smaller, lighter weight below

**Content Slides**:
- Header: Always at top, consistent h-16 space
- Body: Grid or flex layouts with gap-6
- Visual elements: Rounded corners rounded-lg

---

## Interactive Patterns

### Drag/Swipe Navigation
- Visual feedback: transform translateX based on drag
- Threshold indicator: Subtle overlay when 50% to swipe
- Smooth snap animation: transition-transform duration-300 ease-out

### Theme Switching
- Instant color transitions with transition-colors duration-500
- Preserve slide position and state
- Animate theme selector movement

### Export Flow
- Button shows loading state (Exporting...)
- Brief success confirmation
- Auto-download triggers

---

## Responsive Behavior

**Desktop (lg:)**: 
- Full canvas view with side margins
- Theme switcher horizontal
- Navigation arrows positioned outside slide

**Tablet (md:)**:
- Reduced canvas size
- Compact theme switcher
- Navigation arrows on slide edges

**Mobile (base)**:
- Stack view by default (more usable)
- Swipe gestures primary navigation
- Hamburger menu for theme/export if needed

---

## Animation Guidelines

**Minimal, Purposeful Motion**:
- Page transitions: None (instant)
- Slide navigation: Smooth translateX with 300ms duration
- Theme switch: Color fade 500ms
- Button hovers: Subtle scale or opacity shifts
- Loading states: Spinning icons only

**Avoid**: Elaborate entrance animations, parallax effects, or decorative motion

---

## Accessibility

- Keyboard navigation: Arrow keys for slides, Tab for controls
- Focus indicators: Visible ring-2 on all interactive elements
- ARIA labels: On icon-only buttons
- Screen reader: Announce slide changes ("Slide 3 of 10")
- Color contrast: All themes must meet WCAG AA standards

---

This interface prioritizes clarity and efficiency while maintaining visual sophistication appropriate for a creative tool. The presentation canvas is the hero element, with all UI chrome designed to support and enhance the deck creation experience.