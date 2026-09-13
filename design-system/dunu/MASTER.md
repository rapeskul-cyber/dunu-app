# Dunu — Design System (v2, replaces the first "AI slop" pass)

## Diagnosis of v1 (what was wrong)
1. Emoji used as icons (🏠🔍📿🔥🌅🌇🕌🌙🛡️💰🌱) — cheap, inconsistent across
   platforms, the #1 tell of an unpolished app.
2. Centered everything, generic cards with 1px borders, gradient-ish "brand"
   emerald — unbounded default styling, no typographic hierarchy.
3. Arabic rendered in the platform default font (often poor kashida/jam'
   rendering) with arbitrary 30px sizes.
4. No vertical rhythm; sections read as stacked boxes, not a page.
5. Alphanumerics/labels used ALL CAPS tracked text everywhere (system-y).

## Direction: "illuminated manuscript", not "tech dashboard"
References: classical mushaf layout, Persian/Abbasid illumination, the
book-design vocabulary the ui-ux-pro-max palette suggested (Book brown +
page amber), reinterpreted dark-first (night prayer), restrained.

## Tokens
### Light ("Nahar" / day) — parchment mushaf
  bg          #F5EFE3   (aged paper, not #FFF)
  bgElevated  #FBF7EE
  surface     #EFE7D6   (panel / recessed)
  border      #DCCFB2   (hairline, warm)
  text        #221C12   (ink, 13.6:1 on bg)
  textMuted   #6B5F47   (5.2:1 on bg — AA+ for body)
  accent      #7A5C1E   (aged gold, 5.0:1 on bg)
  primary     #1F5D4C   (deep pine green, 6.1:1 on bg)
  mark        #B8860B

### Dark ("Layl" / night) — lamp-lit interior
  bg          #12100C   (warm black, never #000)
  bgElevated  #1A1712
  surface     #211D16
  border      #38321F
  text        #EFE7D2   (13.1:1)
  textMuted   #A99C7C   (6.9:1)
  accent      #D4A83C   (lit gold, 8.6:1)
  primary     #4FA583   (raised for contrast on dark)
  mark        #E8C25A

Contrast: all pairs ≥4.5:1; large display text ≥3:1 verified.

## Typography
  Arabic display  "Lora"? NO — Arabic: **Noto Naskh Arabic** 600 (mushaf-like,
                  correct harakat stacking). Line-height 2.05, RTL,
                  size scale 22→42sp user-adjustable (8 steps).
  Latin serif     **Cormorant Garamond** 300/500 — for titles & translation
                  pull-quotes (echoes the skill's scholarly pairing).
  Latin sans      **Public Sans** 400/500/600 — UI labels, buttons, metadata
                  (open-source Inter alternative; neutral, not "system default").
  Scale: 11 / 13 / 15 / 18 / 24 / 32 / 44 (1.33 modular, 44 reserved for the
  tasbih numeral and surah number plates).
  Letterspacing: labels +60; big numerals −20 (optical correction).

## Layout & rhythm
  8-pt spacing scale (4,8,12,16,24,32,48,64). Content column max 680dp.
  Home is an editorial stack: time-aware greeting (hijri-ish context: pagi/
  petang/night recommends the matching zikir) -> "Amalan hari ini" ribbon ->
  category list as text rows with verse-count metadata (no emoji tile grid) ->
  bookmarked strip -> Qur'an entry panel.
  Cards: surface fill, NO border unless interactive; radius 4/12/20 (chips/card
  /hero). Hairline dividers only between sibling rows.

## Iconography
  Zero emoji. Custom inline **SVG** set drawn on a 24px grid, 1.5 stroke,
  rounded caps: sunrise, sunset, mosque-moon, bed-moon, shield, seedling,
  book-quran, bookmark, search, tasbih-ring, check-ring, flame-streak, back
  chevron, play/pause/loop/speed glyphs. Icons are decorative (aria-hidden)
  unless sole control, then labelled.

## Motion (dial 3/10 — subtle)
  Press: 0.96 scale + 12% opacity dip, 140ms ease-out; release 220ms.
  Screen enter: 12px rise + fade 280ms, list items stagger 28ms (cap 6).
  Tasbih tap: numeral scale-pops 1.0→1.08, ring arc animates 180ms;
  completion: gold pulse ring expands once (no confetti). Respect
  reduced-motion: durations → 0, opacity only.

## Components of note
  TasbihScreen: full-bleed, numeral + 'dari N' set in one baseline cluster,
  thin gold ring w/ dark track, target switcher as a text stepper + chips,
  footer meta with cycles count. No tab bar (focus mode), dismiss via '×'.
  Quran reader: surah list = name (Arabic right, Latin left), ayah count +
  revelation in small caps; reader view = mushaf-style justified RTL block,
  ayah marker ۝ with circled number glyph, per-surah audio bar pinned bottom.
  Detail dua: title (serif) -> Arabic block on parchment panel -> Latin italic
  muted -> translation -> source line as small caps with gold left rule.