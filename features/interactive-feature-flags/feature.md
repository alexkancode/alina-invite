# Interactive Feature Flags Claude Skill

## Overview

A Claude skill that provides interactive feature flag management through a `/feature-flag` command. Users can view current flag states and toggle them in production with proper safety guardrails.

## Problem Statement

Currently, feature flag management requires:
- Manual script execution: `node scripts/feature-flags.js toggle flagName`
- Knowledge of exact flag names
- No visual feedback of current system state
- Multiple command-line operations for common workflows

## Solution

An interactive Claude skill that:
- Shows current flag states in a user-friendly format
- Provides selection-based interaction (no need to remember flag names)
- Includes safety confirmations for production changes
- Integrates seamlessly with existing feature flag infrastructure

## User Experience

```
User: /feature-flag

Claude: Current Feature Flags:
        
        1. musicSearch: ✅ enabled
        2. [future flags would appear here]
        
        Select a flag to toggle (1-2) or type 'status' for details:

User: 1

Claude: ⚠️  Production Toggle Confirmation
        
        Flag: musicSearch
        Current: enabled → will become: disabled
        
        This affects live users immediately.
        Type 'CONFIRM' to proceed:

User: CONFIRM

Claude: ✅ Success! musicSearch toggled
        enabled → disabled
        
        📋 Change logged at 2026-06-08 16:15:23
        🔄 Rollback available for 5 minutes
```

## Technical Architecture

### Skill Structure
- **Entry Point**: `.claude/skills/feature-flag.js`
- **Core Logic**: Query → Present → Confirm → Execute → Report
- **Backend Integration**: Uses existing `scripts/feature-flags.js`
- **Safety Layer**: Multi-step confirmation for production changes

### Integration Points
- **Flag Backend**: Existing feature flag script and JSON storage
- **Validation**: Leverages existing flag name validation
- **Error Handling**: Consistent with current script error patterns
- **Logging**: Extends existing change audit capabilities

## Safety Features

### Production Safeguards
- **Confirmation Workflow**: Multi-step confirmation before production changes
- **Environment Detection**: Validates target environment before execution
- **Change Logging**: Automatic audit trail of all flag modifications
- **Rollback Window**: 5-minute window for immediate rollback capability

### User Experience Safety
- **Clear State Display**: Shows current and target states before change
- **Action Confirmation**: Explicit confirmation required for destructive actions
- **Error Recovery**: Clear error messages with suggested remediation
- **Status Verification**: Post-change confirmation of successful toggle

## Success Criteria

- ✅ Interactive flag selection without manual flag name entry
- ✅ Clear visual display of current flag states  
- ✅ Safe production change workflow with confirmations
- ✅ Integration with existing feature flag infrastructure
- ✅ Audit trail for all flag modifications
- ✅ Error handling consistent with existing patterns
- ✅ Zero breaking changes to current flag management system

## Architecture Benefits

### Developer Experience
- **Faster Workflow**: Single command instead of multiple CLI operations
- **Reduced Errors**: Selection-based interface eliminates typos
- **Better Visibility**: Clear view of system state before making changes
- **Safety Net**: Multiple confirmation steps prevent accidental changes

### System Integration
- **Backward Compatibility**: Uses existing script as execution backend
- **Consistent Patterns**: Follows established error handling and validation
- **Extensible Design**: Easy to add new flags or additional safety features
- **Audit Compliance**: Maintains existing change tracking requirements