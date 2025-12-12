# Versioning Scheme

## Format: `x.y.z`

- **x** (Stable): Major stable releases (e.g., 1.0.0, 2.0.0)
  - Incremented for major architectural changes or breaking changes
  
- **y** (Major Feature): Significant new features or phases
  - Incremented for new feature sets (e.g., Phase 2, Phase 3)
  
- **z** (Bug Fix): Bug fixes, minor improvements, patches
  - **Incremented for all bug fixes and minor updates**
  - This is the primary increment going forward

## Examples

- `1.2.0` → Phase 2 (Authentication) release
- `1.2.1` → Bug fix or minor improvement
- `1.2.2` → Another bug fix
- `1.3.0` → Phase 3 (Reports Dashboard) release
- `1.3.1` → Bug fix after Phase 3

## Current Version

**v1.2.0** - Phase 2: Enhanced Authentication

## Version History

- v1.2.0: Phase 2 - Enhanced Authentication (Login with username OR custom_id)
- v1.1.18: Fixed customer_id database type mismatch
- v1.1.17: Added Rich Text controls to Report Generation
- v1.1.15: PDF Viewer Refactor (react-pdf), Error Codes
