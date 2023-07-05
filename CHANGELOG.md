## [1.5.1] - 2023-07-05

### ⚙️ Miscellaneous Tasks

- *(deps)* Bump @types/react-dom from 18.2.4 to 18.2.6
- *(deps)* Bump typescript from 5.0.4 to 5.1.3
- *(deps)* Bump @types/react from 18.2.12 to 18.2.13
- *(deps)* Bump @vitejs/plugin-react from 4.0.0 to 4.0.1
- *(deps)* Bump react-router-dom from 6.13.0 to 6.14.0
- *(deps)* Bump @types/react from 18.2.13 to 18.2.14
- *(deps)* Bump react-router-dom from 6.14.0 to 6.14.1
- *(deps)* Bump typescript from 5.1.3 to 5.1.6
- *(deps-dev)* Bump @typescript-eslint/eslint-plugin
- *(deps-dev)* Bump eslint from 8.42.0 to 8.43.0
- *(deps-dev)* Bump cypress from 12.14.0 to 12.15.0
- *(deps-dev)* Bump @typescript-eslint/eslint-plugin
- *(deps-dev)* Bump cypress from 12.15.0 to 12.16.0
- *(deps-dev)* Bump eslint from 8.43.0 to 8.44.0
- *(dev-deps)* Bump eslint-config-standard-with-typescript to 36.0.0

## [1.5.0] - 2023-06-17

### ⛰️  Features

- *(barcode_utils)* Added camera support for barcode reader
- Added error handling routes
- Added Barcode Writer tool

### 🎨 Styling

- Added hover effect for sidebar entries
- Use conventional sidebar/navbar colour
- Fixed loading page has overflow

### 🧪 Testing

- *(barcode_reader)* Remove madness test - inconsistent

### ⚙️ Miscellaneous Tasks

- *(deps)* Upgraded dependencies
- *(deps)* Bump @types/react from 18.2.11 to 18.2.12
- *(deps)* Bump sass from 1.63.3 to 1.63.4
- *(deps)* Bump react-router-dom from 6.12.1 to 6.13.0

## [1.4.1] - 2023-06-06

### 🐛 Bug Fixes

- Fixed sidebar entry incorrect active colour

## [1.4.0] - 2023-06-06

### ⛰️  Features

- Added color modes support from Bootstrap 5.3

### 🐛 Bug Fixes

- Added missing bootstrap scss file

### ⚙️ Miscellaneous Tasks

- *(deps)* Bump bootstrap from 5.2.3 to 5.3.0
- *(deps)* Bump @types/react from 18.2.6 to 18.2.8
- *(deps-dev)* Bump eslint from 8.41.0 to 8.42.0
- *(deps-dev)* Bump @typescript-eslint/eslint-plugin
- *(deps-dev)* Bump eslint-config-standard-with-typescript
- Use dynamic import for bootstrap component

## [1.3.4] - 2023-06-03

### ⛰️  Features

- *(barcode_utils)* Added drag & drop file

### 🚜 Refactor

- Move ZXing library load outside of component

### 🧪 Testing

- *(barcode_utils)* Added tests for barcode scanner
- *(password_generator)* Reduce number of tests

### ⚙️ Miscellaneous Tasks

- *(deps)* Bump vite from 4.3.8 to 4.3.9
- *(deps)* Bump @popperjs/core from 2.11.7 to 2.11.8
- *(deps)* Bump csv-parse from 5.3.10 to 5.4.0
- *(deps-dev)* Bump cypress from 12.12.0 to 12.13.0
- *(password_generator)* Extended default password symbols

## [1.3.3] - 2023-06-03

### 🐛 Bug Fixes

- Fixed Cypress CI not triggering

### 🚜 Refactor

- Rename "QR code utilities" to "Barcode utilities"

### ⚙️ Miscellaneous Tasks

- *(deps)* Bump vite from 4.3.7 to 4.3.8
- *(deps)* Bump react-router-dom from 6.11.1 to 6.11.2
- *(deps)* Bump vite from 4.3.8 to 4.3.9
- *(deps)* Bump @popperjs/core from 2.11.7 to 2.11.8
- *(deps)* Bump csv-parse from 5.3.10 to 5.4.0
- *(deps-dev)* Bump @typescript-eslint/eslint-plugin

## [1.3.2] - 2023-05-23

### 🚜 Refactor

- Rename "QR code utilities" to "Barcode utilities"

### ⚙️ Miscellaneous Tasks

- *(deps)* Bump vite from 4.3.7 to 4.3.8
- *(deps)* Bump react-router-dom from 6.11.1 to 6.11.2
- *(deps-dev)* Bump eslint from 8.40.0 to 8.41.0

## [1.3.1] - 2023-05-22

### 🐛 Bug Fixes

- Fixed QR read on SVG image

## [1.3.0] - 2023-05-20

### ⛰️  Features

- Added QR code reader (1st QR utility)

### ⚡ Performance

- Moved set page title to loader

## [1.2.10] - 2023-05-20

### 🐛 Bug Fixes

- *(password_generator)* Fixed infinite loop

### 🧪 Testing

- Implemented Cypress tests and CI

### ⚙️ Miscellaneous Tasks

- *(deps)* Updated dependencies
- *(deps-dev)* Bump vite from 4.3.5 to 4.3.6
- *(deps-dev)* Bump vite from 4.3.5 to 4.3.6
- *(lint)* Expand Lint workflow trigger paths

### Signed-off-by

- Dependabot[bot] <support@github.com>

## [1.2.9] - 2023-05-15

### ⛰️  Features

- *(csv_display_table)* Added word-wrap for table

### ⚙️ Miscellaneous Tasks

- *(lint)* Added lint check workflow

# Changelog

All notable changes to this project will be documented in this file.

## [1.2.8] - 2023-05-14

### ⛰️  Features

- *(csv_display_table)* Added pagination to table

## [1.2.7+patch1] - 2023-05-14

### 🐛 Bug Fixes

- Fixed incorrect header when one row has more columns

## [1.2.7] - 2023-05-14

### ⛰️  Features

- *(csv_display_table)* Implemented React Table 🎉

### 🐛 Bug Fixes

- Fixed sidebar once again

### 🎨 Styling

- Move bootstrap to custom scss file

### ⚙️ Miscellaneous Tasks

- *(deploy)* Added lint check before build

## [1.2.6] - 2023-05-13

### ⛰️  Features

- *(password_generator)* Now make sure all requirements are met
- Added new loading state

### 🐛 Bug Fixes

- Fixed Sidebar incorrect nav link styling
- Fixed navbar collapse on mobile

### 🚜 Refactor

- *(csv_swap)* Reduce usage of `useState`
- Dynamic tools in sidebar and router
- Cleanup `generatePassword()` function

### 🎨 Styling

- *(password_generator)* Hide buttons' labels for mobile

## [1.2.5] - 2023-05-11

### 🐛 Bug Fixes

- *(password_generator)* Click on label does not focus input

### ⚙️ Miscellaneous Tasks

- *(deploy)* Cache packages and use built-in yarn

## [1.2.4] - 2023-05-11

### ⛰️  Features

- *(password_generator)* Added reveal password toggle

### 🚜 Refactor

- *(csv_display_table)* Reduce usage of `useState`

### ⚙️ Miscellaneous Tasks

- *(action)* Added new workflow to create a release
- *(deploy)* Only build page on new tags
- Updated new git-cliff template

## [1.2.3] - 2023-05-11

### 🚜 Refactor

- Use a more secure random generator

## [1.2.2] - 2023-05-11

### ⛰️  Features

- Added ESLint
- Store password generator options in localStorage

### ⚙️ Miscellaneous Tasks

- Added page title to each tool page

## [1.2.1] - 2023-05-10

### 🐛 Bug Fixes

- Switch to HashRouter to fix GitHub pages refresh

## [1.2.0] - 2023-05-10

### ⛰️  Features

- Added password generator

### ⚙️ Miscellaneous Tasks

- *(deps)* Updated dependencies, added bootstrap-icons

## [1.1.2] - 2023-01-10

### 🐛 Bug Fixes

- Remove bootstrap icons css being imported

## [1.1.1] - 2023-01-10

### ⛰️  Features

- Sidebar is responsive

## [1.1.0] - 2023-01-10

### ⛰️  Features

- Added CSV display table tool

### ⚙️ Miscellaneous Tasks

- *(deps)* Added react router & updated other deps
- *(release)* Re-release on main branch

## [1.0.2] - 2022-12-16

### ⚙️ Miscellaneous Tasks

- *(cliff)* Added scope to commit message
- *(release)* Updated CHANGELOG.md
- *(workflow)* Fixed incorrect yarn cmd

## [1.0.1] - 2022-12-16

### 🐛 Bug Fixes

- Prod path base path build

### ⚙️ Miscellaneous Tasks

- *(release)* Added CHANGELOG.md
- *(workflow)* Updated workflow action
- Updated title
- Added cliff conf

<!-- generated by git-cliff -->
