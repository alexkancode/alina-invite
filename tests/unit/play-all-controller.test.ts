import { beforeEach, describe, expect, test, vi } from 'vitest';
import { PlayAllController } from '../../src/components/guest-list/PlayAllController';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('PlayAllController', () => {
  let container: HTMLElement;
  let trigger: HTMLButtonElement;
  let playbackController: { handlePlayClick: ReturnType<typeof vi.fn> };
  let controller: PlayAllController;
  let buttons: HTMLButtonElement[];

  const createCardButton = (id: string): HTMLButtonElement => {
    const button = document.createElement('button');
    button.className = 'guest-song-play';
    button.dataset.trackId = id;
    container.appendChild(button);
    return button;
  };

  const endPreview = (button: HTMLButtonElement, reason: string) => {
    button.dataset.previewState = 'idle';
    button.dispatchEvent(new CustomEvent('preview-ended', { bubbles: true, detail: { reason } }));
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    trigger = document.createElement('button');
    document.body.appendChild(trigger);

    playbackController = {
      handlePlayClick: vi.fn(async (button: HTMLButtonElement) => {
        button.dataset.previewState = 'playing';
      })
    };

    controller = new PlayAllController(container, trigger, playbackController as never);
    buttons = ['a', 'b', 'c'].map(createCardButton);
  });

  test('toggle starts the first card and marks the trigger running', async () => {
    controller.toggle();
    await flush();

    expect(playbackController.handlePlayClick).toHaveBeenCalledTimes(1);
    expect(playbackController.handlePlayClick).toHaveBeenCalledWith(buttons[0]);
    expect(trigger.dataset.playlistState).toBe('running');
  });

  test('a natural end advances to the next card in DOM order', async () => {
    controller.toggle();
    await flush();

    endPreview(buttons[0], 'ended');
    await flush();

    expect(playbackController.handlePlayClick).toHaveBeenLastCalledWith(buttons[1]);
  });

  test('finishing the last card resets the trigger to idle', async () => {
    controller.toggle();
    await flush();
    endPreview(buttons[0], 'ended');
    await flush();
    endPreview(buttons[1], 'ended');
    await flush();
    endPreview(buttons[2], 'ended');
    await flush();

    expect(trigger.dataset.playlistState).toBe('idle');
    expect(playbackController.handlePlayClick).toHaveBeenCalledTimes(3);
  });

  test('a card that never reaches the playing state is skipped immediately', async () => {
    playbackController.handlePlayClick.mockImplementationOnce(async (button: HTMLButtonElement) => {
      button.classList.add('spotify-preview-unavailable');
    });

    controller.toggle();
    await flush();

    expect(playbackController.handlePlayClick).toHaveBeenCalledTimes(2);
    expect(playbackController.handlePlayClick).toHaveBeenLastCalledWith(buttons[1]);
  });

  test('an error end advances rather than aborting', async () => {
    controller.toggle();
    await flush();

    endPreview(buttons[0], 'error');
    await flush();

    expect(playbackController.handlePlayClick).toHaveBeenLastCalledWith(buttons[1]);
    expect(trigger.dataset.playlistState).toBe('running');
  });

  test('a user stop aborts the sequence and resets the trigger', async () => {
    controller.toggle();
    await flush();

    endPreview(buttons[0], 'stopped');
    await flush();

    expect(playbackController.handlePlayClick).toHaveBeenCalledTimes(1);
    expect(trigger.dataset.playlistState).toBe('idle');
  });

  test('toggling while running stops the current preview and resets', async () => {
    const stopSpy = vi.fn();
    buttons[0].addEventListener('click', stopSpy);

    controller.toggle();
    await flush();

    controller.toggle();
    await flush();

    expect(trigger.dataset.playlistState).toBe('idle');
    expect(playbackController.handlePlayClick).toHaveBeenCalledTimes(2);
    expect(playbackController.handlePlayClick).toHaveBeenLastCalledWith(buttons[0]);
  });

  test('events from cards the sequence is not waiting on are ignored', async () => {
    controller.toggle();
    await flush();

    endPreview(buttons[2], 'ended');
    await flush();

    expect(playbackController.handlePlayClick).toHaveBeenCalledTimes(1);
    expect(trigger.dataset.playlistState).toBe('running');
  });

  test('toggle with no card buttons stays idle', async () => {
    container.innerHTML = '';

    controller.toggle();
    await flush();

    expect(playbackController.handlePlayClick).not.toHaveBeenCalled();
    expect(trigger.dataset.playlistState).toBe('idle');
  });
});
