// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { initial, readData, writeData } from './data';
import * as storage from './data';

beforeEach(async () => {
  vi.restoreAllMocks();
  await writeData(structuredClone(initial));
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  window.scrollTo = vi.fn();
});
afterEach(cleanup);

async function openApp() {
  render(<App/>);
  await screen.findByRole('heading', { name: /Good (morning|afternoon|evening)/ });
}

describe('personal prayer experience', () => {
  it('retries a failed save without duplicating the new prayer', async () => {
    const user = userEvent.setup();
    await openApp();
    const persist = vi.spyOn(storage, 'writeData').mockRejectedValueOnce(new Error('Storage full'));
    await user.click(screen.getByRole('button', { name: 'Add a prayer' }));
    const editor = screen.getByRole('dialog');
    await user.type(within(editor).getByLabelText('Prayer title'), 'A prayer to keep');
    await user.click(within(editor).getByRole('button', { name: 'Save prayer' }));
    await screen.findByText('Could not save. Keep this window open and export a backup.');
    expect(screen.getByRole('dialog')).toBeTruthy();
    persist.mockRestore();
    await user.click(within(editor).getByRole('button', { name: 'Save prayer' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect((await readData()).prayers).toHaveLength(1);
  });

  it('blocks writes when existing records cannot be read', async () => {
    vi.spyOn(storage, 'readData').mockRejectedValueOnce(new Error('Device storage unavailable'));
    render(<App/>);
    await screen.findByRole('heading', { name: 'Your saved space could not be opened.' });
    expect(screen.queryByRole('button', { name: 'Add a prayer' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('creates a prayer, saves its history, and moves an answer to the garden', async () => {
    const user = userEvent.setup();
    await openApp();
    await user.click(screen.getByRole('button', { name: 'Add a prayer' }));
    const editor = screen.getByRole('dialog');
    await user.type(within(editor).getByLabelText('Prayer title'), 'A peaceful week');
    await user.type(within(editor).getByLabelText('What is on your heart?'), 'Help our family find time together.');
    await user.selectOptions(within(editor).getByLabelText('Category'), 'Family');
    await user.click(within(editor).getByRole('button', { name: 'Save prayer' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await user.click(screen.getByRole('button', { name: /A peaceful week/ }));
    const details = screen.getByRole('dialog');
    await user.type(within(details).getByLabelText('What has changed?'), 'We shared a meal and a good conversation.');
    await user.click(within(details).getByRole('button', { name: 'Add an update' }));
    await waitFor(async () => expect((await readData()).prayers[0].updates).toHaveLength(1));
    await user.selectOptions(within(details).getByLabelText('Prayer status'), 'Answered');
    await waitFor(async () => expect((await readData()).prayers[0].status).toBe('Answered'));
    await user.click(within(details).getByRole('button', { name: 'Close dialog' }));
    await user.click(screen.getByRole('button', { name: 'Gratitude garden' }));
    expect(await screen.findByRole('heading', { name: 'A peaceful week' })).toBeTruthy();
    expect(screen.getByText('We shared a meal and a good conversation.')).toBeTruthy();
  });

  it('keeps Tamil journal text after remounting and out of the group preview', async () => {
    const user = userEvent.setup();
    await openApp();
    await user.click(screen.getByRole('button', { name: 'Write a reflection' }));
    const editor = screen.getByRole('dialog');
    await user.type(within(editor).getByLabelText('Name your reflection'), 'நன்றி');
    await user.type(within(editor).getByLabelText('Your reflection'), 'என் குடும்பத்திற்காக நன்றி');
    await user.click(within(editor).getByRole('button', { name: 'Save reflection' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    cleanup();
    await openApp();
    await user.click(screen.getAllByRole('button', { name: 'Journal' })[0]);
    expect(await screen.findByRole('heading', { name: 'நன்றி' })).toBeTruthy();
    expect(screen.getByText('என் குடும்பத்திற்காக நன்றி')).toBeTruthy();
    await user.click(screen.getAllByRole('button', { name: 'Pray together' })[0]);
    expect(screen.queryByText('என் குடும்பத்திற்காக நன்றி')).toBeNull();
    expect(screen.getByText('COMING IN A FUTURE RELEASE')).toBeTruthy();
  });

  it('runs an untimed guided session and saves an optional closing reflection', async () => {
    const user = userEvent.setup();
    await openApp();
    await user.click(screen.getByRole('button', { name: 'Begin prayer' }));
    const session = screen.getByRole('dialog');
    await user.click(within(session).getByRole('button', { name: 'Untimed' }));
    await user.click(within(session).getByRole('button', { name: 'Begin prayer' }));
    expect(within(session).getByRole('heading', { name: 'Be still.' })).toBeTruthy();
    await user.click(within(session).getByRole('button', { name: 'Pause timer' }));
    expect(within(session).getByRole('timer').textContent).toContain('paused');
    await user.click(within(session).getByRole('button', { name: 'Resume timer' }));
    for (let step = 0; step < 5; step++) await user.click(within(session).getByRole('button', { name: 'Next moment' }));
    await user.click(within(session).getByRole('button', { name: 'Save a reflection' }));
    await screen.findByRole('heading', { name: 'New reflection' });
    expect((await readData()).sessions).toHaveLength(1);
  });

  it('persists language and appearance preferences without changing personal records', async () => {
    const user = userEvent.setup();
    await openApp();
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.selectOptions(screen.getByLabelText('Language'), 'ta');
    await waitFor(() => expect(document.documentElement.lang).toBe('ta'));
    await user.click(screen.getByRole('switch', { name: 'இருண்ட தோற்றம்' }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    await waitFor(async () => expect((await readData()).settings).toMatchObject({ language: 'ta', dark: true }));
    expect((await readData()).prayers).toEqual([]);
  });
});
