import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import JSZip from 'jszip';
import { DeployView } from '../../../components/designV2/views';
import { DEPLOY } from '../../../components/designV2/constants';
import useAppStore from '../../../store/store';
import * as latePayment from '../../../samples/latePaymentPenalty';

/*
 * The Deploy step's "Download template" card saves the template as a .cta
 * archive named after the sample, with the logic the Logic editor holds.
 */
/** jsdom's Blob has no arrayBuffer(); FileReader reads it. */
const readBlob = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

describe('DeployView — Download template', () => {
  let saved: { blob: Blob; fileName: string }[];

  beforeEach(() => {
    saved = [];
    const blobs = new Map<string, Blob>();
    // jsdom has no object URLs: record each Blob under a made-up one.
    URL.createObjectURL = vi.fn((blob: Blob) => {
      const url = `blob:test/${blobs.size}`;
      blobs.set(url, blob);
      return url;
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      saved.push({ blob: blobs.get(this.href)!, fileName: this.download });
    });
    useAppStore.setState({
      sampleName: latePayment.NAME,
      templateMarkdown: latePayment.TEMPLATE,
      modelCto: latePayment.MODEL,
      logicTs: latePayment.LOGIC,
      editorLogicTs: latePayment.LOGIC + '\n// edited',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error -- removing the stand-ins jsdom does not provide
    delete URL.createObjectURL;
    // @ts-expect-error -- as above
    delete URL.revokeObjectURL;
  });

  const download = async () => {
    render(<DeployView />);
    fireEvent.click(screen.getByRole('button', { name: DEPLOY.download.button }));
    await waitFor(() => expect(saved).toHaveLength(1));
    return { fileName: saved[0].fileName, zip: await JSZip.loadAsync(await readBlob(saved[0].blob)) };
  };

  it('saves a .cta named after the sample, with the text, model and the edited logic', async () => {
    const { fileName, zip } = await download();
    expect(fileName).toBe('late-payment-penalty-with-logic.cta');
    expect(await zip.file('text/grammar.tem.md')!.async('string')).toBe(latePayment.TEMPLATE);
    expect(await zip.file('model/model.cto')!.async('string')).toBe(latePayment.MODEL);
    expect(await zip.file('logic/logic.ts')!.async('string')).toBe(latePayment.LOGIC + '\n// edited');
  });

  it('leaves logic out of a template without logic', async () => {
    useAppStore.setState({ logicTs: '', editorLogicTs: '' });
    const { zip } = await download();
    expect(zip.file('logic/logic.ts')).toBeNull();
  });
});
