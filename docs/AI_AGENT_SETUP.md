# AI Agent Development Setup

> Historical context only. This document is not the operational source of truth.
>
> Canonical agent instructions live in `AGENTS.md`.

This document explains how this repository is optimized for AI agent-driven development.

## Overview

This repository has been configured to provide AI assistants (like Claude Code, Cursor, GitHub Copilot, etc.) with comprehensive context about:
- Project structure and conventions
- Design principles and patterns
- Common tasks and workflows
- API contracts and database schema
- Testing patterns

## Documentation Structure

```
.
├── CLAUDE.md                          # 🎯 START HERE - Essential conventions
├── AGENTS.md                          # Available AI skills & workflows
├── .cursorrules                       # Detailed project conventions
├── CODE_REVIEW_CHECKLIST.md          # Code review standards
├── README.md                          # Setup instructions (with AI pointer)
│
├── docs/
│   ├── AI_AGENT_SETUP.md             # This file - meta documentation
│   ├── API.md                         # API endpoint reference
│   ├── EXAMPLES.md                    # Code examples & patterns
│   ├── DESIGN_PRINCIPLES.md          # Full design specification
│   └── [other docs]                   # Feature-specific docs
│
└── .agent/
    ├── skills/                        # Specialized guidance
    │   ├── brand-guidelines/          # Design tokens & Nine Laws
    │   ├── frontend-design/           # UI best practices
    │   ├── webapp-testing/            # Playwright patterns
    │   ├── content-forge/             # Content creation
    │   ├── modular-refactor/          # Refactoring patterns
    │   ├── void-mode-audit/           # Design audit
    │   └── supabase-patterns/         # Database patterns
    │
    └── workflows/                     # Step-by-step processes
        ├── add-component.md           # Component creation
        ├── code-review-checklist.md   # Code review
        ├── create-pr.md               # Pull request creation
        ├── debug.md                   # Debugging process
        ├── deslop.md                  # Remove AI slop
        └── setup-new-feature.md       # Feature setup
```

## Entry Points for AI Assistants

### Primary Entry Point: `CLAUDE.md`
The canonical reference for AI assistants. Contains:
- Project overview & tech stack
- Critical multi-file consistency rules
- Design system principles (Nine Laws)
- Project structure
- Common patterns (API routes, components, data fetching)
- Available skills & workflows
- Code style conventions
- Environment setup
- Known gotchas

### Secondary References
- **`AGENTS.md`**: Quick reference for skills and workflows
- **`.cursorrules`**: Detailed conventions (used by Cursor AI)
- **`docs/EXAMPLES.md`**: Practical code examples
- **`docs/API.md`**: API endpoint reference

## What Makes This Repo AI-Friendly

### 1. Explicit Conventions
Instead of expecting AI to infer patterns, we explicitly document:
- File naming conventions
- Code organization rules
- Multi-file consistency requirements
- Design principles

### 2. Known Gotchas Documented
Common mistakes are explicitly called out:
- "When changing nav items, update 5 files"
- "Always clean up unused imports"
- "Don't use flat colors, use glassmorphism"

### 3. Skills & Workflows
Task-specific guidance for common operations:
- Creating components that follow design system
- Running code reviews
- Creating pull requests
- Debugging systematically

### 4. Examples Over Theory
`docs/EXAMPLES.md` provides copy-paste-adapt examples:
- Complete component implementations
- API route patterns
- Database migrations
- Testing patterns

### 5. API Documentation
`docs/API.md` provides:
- All endpoints organized by feature
- Request/response patterns
- Authentication requirements
- Error handling conventions

## How AI Assistants Use This Documentation

### First-Time Context
When an AI assistant first encounters this repo:
1. Read `CLAUDE.md` for overview and critical rules
2. Scan `AGENTS.md` for available skills
3. Reference `.cursorrules` for detailed conventions
4. Check `docs/EXAMPLES.md` for implementation patterns

### Task-Specific Guidance
For specific tasks:
- **Creating UI**: Read `.agent/skills/brand-guidelines/SKILL.md`
- **Writing tests**: Read `.agent/skills/webapp-testing/SKILL.md`
- **Refactoring**: Read `.agent/skills/modular-refactor/SKILL.md`
- **API work**: Reference `docs/API.md`

### Avoiding Common Mistakes
Before making changes:
- Check `CLAUDE.md` "Critical Rules" section
- Review "Known gotchas" in `.cursorrules`
- Verify multi-file consistency requirements

## Maintenance Guidelines

### When to Update Documentation

**Update `CLAUDE.md` when**:
- Adding new critical conventions
- Changing project structure
- Adding new tech stack components
- Identifying common AI mistakes

**Update `AGENTS.md` when**:
- Adding new skills or workflows
- Changing skill descriptions
- Updating file paths

**Update `docs/EXAMPLES.md` when**:
- Establishing new patterns
- Changing common implementations
- Adding new feature types

**Update `docs/API.md` when**:
- Adding new API endpoints
- Changing authentication requirements
- Modifying request/response patterns

### Keep Documentation DRY

- **Single source of truth**: Don't duplicate information
- **Link between docs**: Reference other docs instead of repeating
- **Hierarchical structure**: `CLAUDE.md` → detailed docs → skill files

### Documentation Review Checklist

Periodically review (e.g., quarterly):
- [ ] Are critical rules still accurate?
- [ ] Do examples reflect current patterns?
- [ ] Are new common patterns documented?
- [ ] Are deprecated patterns removed?
- [ ] Are file paths still correct?
- [ ] Do links between docs work?

## Benefits of This Setup

### For AI Assistants
✅ **Faster onboarding** - Clear entry point and conventions
✅ **Fewer mistakes** - Common gotchas explicitly documented
✅ **Better consistency** - Design system and patterns enforced
✅ **More autonomous** - Skills and workflows provide guidance
✅ **Less back-and-forth** - Examples reduce need for clarification

### For Human Developers
✅ **Faster code reviews** - AI follows conventions better
✅ **More consistent codebase** - AI applies patterns uniformly
✅ **Less repetitive work** - AI handles boilerplate correctly
✅ **Better onboarding** - New devs can read same docs
✅ **Documentation stays current** - Used daily by AI, so kept updated

### For the Project
✅ **Higher code quality** - Conventions consistently applied
✅ **Faster feature development** - AI can work more autonomously
✅ **Better test coverage** - Testing patterns documented
✅ **Easier refactoring** - Patterns are explicit and documented

## Comparison to Other Projects

| Aspect | Typical Project | This Project |
|--------|----------------|--------------|
| AI Entry Point | README.md only | Dedicated `CLAUDE.md` |
| Conventions | Implicit/scattered | Explicit in `.cursorrules` |
| Gotchas | Not documented | Explicitly listed |
| Code Examples | None or sparse | Comprehensive `EXAMPLES.md` |
| API Docs | None | Full `API.md` reference |
| Design System | Implicit | Explicit "Nine Laws" |
| AI Skills | Not available | 7 specialized skills |
| Workflows | Not documented | 6 step-by-step workflows |

## Success Metrics

You'll know this setup is working when:
- AI assistants make fewer multi-file consistency mistakes
- Code reviews find fewer convention violations
- AI-generated code follows design system without prompting
- New features are implemented more autonomously
- AI rarely needs clarification on project patterns

## Next Steps to Further Improve

### Short Term (Optional)
- [ ] Add architecture diagrams (system overview, data flow)
- [ ] Document component library (if creating reusable components)
- [ ] Add more examples for complex patterns
- [ ] Create video walkthrough of codebase

### Medium Term
- [ ] Generate OpenAPI/Swagger docs from API routes
- [ ] Add automated convention checking (linting rules)
- [ ] Create "recipes" for common feature implementations
- [ ] Add performance budgets and monitoring

### Long Term
- [ ] Consider creating a custom GPT with this documentation
- [ ] Build automated documentation generation from code
- [ ] Create interactive documentation with live examples
- [ ] Integrate with AI coding assistants via MCP

## Resources

### For AI Assistants
- **Claude Code**: Uses `CLAUDE.md` and `.cursorrules`
- **Cursor**: Uses `.cursorrules` and `.cursor/` directory
- **GitHub Copilot**: Benefits from clear comments and examples
- **Cody**: Uses documentation for context

### For Human Developers
- **Onboarding**: Start with README → CLAUDE.md → EXAMPLES.md
- **Daily Work**: Keep `CLAUDE.md` and `AGENTS.md` handy
- **Code Review**: Use `CODE_REVIEW_CHECKLIST.md`
- **Design Work**: Reference `.agent/skills/brand-guidelines/`

## Conclusion

This repository is now in the **top tier** of AI agent readiness. The key differentiators are:

1. **Dedicated AI entry point** (`CLAUDE.md`)
2. **Explicit conventions** (not just implied patterns)
3. **Known gotchas documented** (prevents repeated mistakes)
4. **Comprehensive examples** (real, copy-pasteable code)
5. **Specialized skills** (task-specific guidance)

Maintain this documentation alongside the code, and you'll continue to benefit from faster, more accurate AI-assisted development.

---

**Last Updated**: 2026-02-14
**Maintained By**: Project team
**Questions?**: See `CLAUDE.md` or ask in project discussions
