/**
 * Visual progress indicator showing pipeline steps.
 */

import { useMemo } from 'react';
import useAppStore from '../../store/store';
import { CiceroStepIndicatorProps, Step } from './types';

const STEPS: Step[] = [
  { id: 'coordinator', label: 'Brief', icon: '§' },
  { id: 'agent1', label: 'Template', icon: '¶' },
  { id: 'agent2', label: 'Model', icon: '◇' },
  { id: 'agent3', label: 'Logic', icon: 'λ' },
  { id: 'agent4', label: 'Validate', icon: '✓' },
  { id: 'package', label: 'Package', icon: '⊞' },
];

export const CiceroStepIndicator = ({
  currentStep,
  completedSteps,
  failedStep,
}: CiceroStepIndicatorProps): JSX.Element => {
  const { backgroundColor } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
  }));

  const theme = useMemo(() => {
    const isDarkMode = backgroundColor !== '#ffffff';
    return {
      completedBg: '#16a34a',
      failedBg: '#dc2626',
      currentBg: isDarkMode ? '#3b82f6' : '#1e293b',
      inactiveBg: isDarkMode ? '#334155' : '#e2e8f0',
      completedText: '#fff',
      failedText: '#fff',
      currentText: '#fff',
      inactiveText: isDarkMode ? '#64748b' : '#94a3b8',
      labelActive: isDarkMode ? '#e2e8f0' : '#1e293b',
      labelInactive: isDarkMode ? '#64748b' : '#94a3b8',
      labelCompleted: '#16a34a',
      connectorActive: '#16a34a',
      connectorInactive: isDarkMode ? '#334155' : '#e2e8f0',
    };
  }, [backgroundColor]);

  return (
    <div
      className="twp"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        margin: '0 0 20px 0',
        overflowX: 'auto',
        padding: '4px 0',
      }}
    >
      {STEPS.map((step, i) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isFailed = failedStep === step.id;
        const isPast = completedSteps.includes(step.id);

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 56,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-primary, Rubik, sans-serif)',
                  transition: 'all 0.3s ease-out',
                  background: isFailed
                    ? theme.failedBg
                    : isCompleted
                    ? theme.completedBg
                    : isCurrent
                    ? theme.currentBg
                    : theme.inactiveBg,
                  color: isFailed || isCompleted || isCurrent ? '#fff' : theme.inactiveText,
                  boxShadow: isCurrent ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : 'none',
                }}
              >
                {isFailed ? '✕' : isCompleted ? '✓' : step.icon}
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent
                    ? theme.labelActive
                    : isPast
                    ? theme.labelCompleted
                    : theme.labelInactive,
                  marginTop: 4,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontFamily: "'IBM Plex Mono', 'SF Mono', monospace",
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: 20,
                  height: 2,
                  background: isPast ? theme.connectorActive : theme.connectorInactive,
                  borderRadius: 1,
                  marginBottom: 18,
                  transition: 'background 0.3s',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CiceroStepIndicator;
