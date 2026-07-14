import { describe, it, expect } from 'vitest';
import { NAME, MODEL, TEMPLATE, DATA, REQUEST, LOGIC } from '../../samples/latePaymentPenalty';

describe('latePaymentPenalty sample', () => {
  describe('exports', () => {
    it('should export NAME as a non-empty string', () => {
      expect(NAME).toBe('Late Payment Penalty (with Logic)');
    });

    it('should export MODEL as a non-empty string containing the namespace', () => {
      expect(MODEL).toContain('namespace org.acme.latepayment@1.0.0');
    });

    it('should export TEMPLATE as a non-empty string', () => {
      expect(typeof TEMPLATE).toBe('string');
      expect(TEMPLATE.length).toBeGreaterThan(0);
    });

    it('should export DATA as a valid object with correct $class', () => {
      expect(DATA).toBeDefined();
      expect(DATA.$class).toBe('org.acme.latepayment@1.0.0.TemplateModel');
    });

    it('should export REQUEST as a valid object with correct $class', () => {
      expect(REQUEST).toBeDefined();
      expect(REQUEST.$class).toBe('org.acme.latepayment@1.0.0.LatePaymentRequest');
    });

    it('should export LOGIC as a non-empty string', () => {
      expect(typeof LOGIC).toBe('string');
      expect(LOGIC.length).toBeGreaterThan(0);
    });
  });

  describe('Concerto Model', () => {
    it('should use @template decorator on the TemplateModel concept', () => {
      expect(MODEL).toContain('@template');
      expect(MODEL).toContain('concept TemplateModel');
    });

    it('should define LatePaymentRequest transaction', () => {
      expect(MODEL).toContain('transaction LatePaymentRequest');
    });

    it('should define LatePaymentResponse transaction', () => {
      expect(MODEL).toContain('transaction LatePaymentResponse');
    });

    it('should define LatePaymentEvent event with contractTerminated', () => {
      expect(MODEL).toContain('event LatePaymentEvent');
      expect(MODEL).toContain('o Boolean contractTerminated');
    });

    it('should define LatePaymentState asset', () => {
      expect(MODEL).toContain('asset LatePaymentState identified by stateId');
    });

    it('should import Duration from accordproject time model', () => {
      expect(MODEL).toContain('import org.accordproject.time@0.3.0.Duration');
    });
  });

  describe('TemplateMark', () => {
    it('should include a conditional block for forceMajeure', () => {
      expect(TEMPLATE).toContain('{{#if forceMajeure}}');
      expect(TEMPLATE).toContain('{{/if}}');
    });

    it('should bind all TemplateModel fields', () => {
      expect(TEMPLATE).toContain('{{penaltyDuration}}');
      expect(TEMPLATE).toContain('{{penaltyPercentage}}');
      expect(TEMPLATE).toContain('{{capPercentage}}');
      expect(TEMPLATE).toContain('{{termination}}');
      expect(TEMPLATE).toContain('{{fractionalPart}}');
    });
  });

  describe('DATA (contract terms)', () => {
    it('should have forceMajeure as a boolean', () => {
      expect(typeof DATA.forceMajeure).toBe('boolean');
    });

    it('should have penaltyDuration as a Duration object', () => {
      expect(DATA.penaltyDuration).toBeDefined();
      expect((DATA.penaltyDuration as Record<string, unknown>).$class).toBe('org.accordproject.time@0.3.0.Duration');
      expect((DATA.penaltyDuration as Record<string, unknown>).amount).toBeGreaterThan(0);
    });

    it('should have numeric penaltyPercentage and capPercentage', () => {
      expect(typeof DATA.penaltyPercentage).toBe('number');
      expect(typeof DATA.capPercentage).toBe('number');
      expect(DATA.capPercentage).toBeGreaterThan(DATA.penaltyPercentage);
    });

    it('should have termination as a Duration object', () => {
      expect(DATA.termination).toBeDefined();
      expect((DATA.termination as Record<string, unknown>).$class).toBe('org.accordproject.time@0.3.0.Duration');
    });
  });

  describe('REQUEST (trigger input)', () => {
    it('should have forceMajeure boolean', () => {
      expect(typeof REQUEST.forceMajeure).toBe('boolean');
    });

    it('should have agreedPayment as an ISO date string', () => {
      expect(typeof REQUEST.agreedPayment).toBe('string');
      expect(new Date(REQUEST.agreedPayment).toISOString()).toBe(REQUEST.agreedPayment);
    });

    it('should have invoiceValue as a positive number', () => {
      expect(typeof REQUEST.invoiceValue).toBe('number');
      expect(REQUEST.invoiceValue).toBeGreaterThan(0);
    });
  });

  describe('LOGIC (TypeScript contract logic)', () => {
    it('should extend TemplateLogic', () => {
      expect(LOGIC).toContain('extends TemplateLogic');
    });

    it('should define an init method', () => {
      expect(LOGIC).toContain('async init(');
    });

    it('should define a trigger method', () => {
      expect(LOGIC).toContain('async trigger(');
    });

    it('should handle Force Majeure exemption', () => {
      expect(LOGIC).toContain('data.forceMajeure && request.forceMajeure');
    });

    it('should calculate penalty with cap enforcement', () => {
      expect(LOGIC).toContain('capPercentage');
      expect(LOGIC).toContain('maxPenalty');
    });

    it('should check termination condition', () => {
      expect(LOGIC).toContain('sellerMayTerminate');
      expect(LOGIC).toContain('data.termination.amount');
    });

    it('should return result, state, and events in trigger', () => {
      expect(LOGIC).toContain('result:');
      expect(LOGIC).toContain('state:');
      expect(LOGIC).toContain('events:');
    });

    it('should return correct $class references in trigger output', () => {
      expect(LOGIC).toContain("$class: 'org.acme.latepayment@1.0.0.LatePaymentResponse'");
      expect(LOGIC).toContain("$class: 'org.acme.latepayment@1.0.0.LatePaymentState'");
      expect(LOGIC).toContain("$class: 'org.acme.latepayment@1.0.0.LatePaymentEvent'");
    });

    it('should emit contractTerminated in events', () => {
      expect(LOGIC).toContain('contractTerminated: sellerMayTerminate');
    });

    it('should increment count in state', () => {
      expect(LOGIC).toContain('count: currentCount + 1');
    });
  });
});
