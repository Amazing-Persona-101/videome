import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { setupI18nMock } from '$lib/tests/mocks/i18n';
import AvatarSelector from './AvatarSelector.svelte';

// Set up the i18n mock before all tests
setupI18nMock();

import { locale } from 'svelte-i18n';

// Mock the external modules to control their behavior
vi.mock('$lib/identity/guest', () => ({
  // Mock a consistent seed for predictable testing
  randomSeed: vi.fn(() => 'test-seed'),
  // Mock the buildRoboUrl to return a predictable string
  buildRoboUrl: vi.fn((set, seed, size) => `mock-url-${set}-${seed}-${size}`),
  // Mock getRandomName to return a predictable promise
  getRandomName: vi.fn(() => Promise.resolve('MockName'))
}));

describe('AvatarSelector', () => {
  beforeEach(() => {
    // Set the locale before each test
    locale.set('en');
  });
  // A mock function to pass to the component's avatarSelected prop
  const mockAvatarSelected = vi.fn();

  // Test 1: Check if the component renders with the correct initial content.
  it('should render the component with correct titles and descriptions', () => {
    render(AvatarSelector, { avatarSelected: mockAvatarSelected });

    // Verify the title and description are in the document
    expect(screen.getByText('Choose your avatar style..')).toBeInTheDocument();
    expect(screen.getByText("We'll create a name and image for you!")).toBeInTheDocument();

    // Verify that all four avatar sets are rendered
    expect(screen.getByText('robot')).toBeInTheDocument();
    expect(screen.getByText('monster')).toBeInTheDocument();
    expect(screen.getByText('head')).toBeInTheDocument();
    expect(screen.getByText('cat')).toBeInTheDocument();

    // Check if the "Choose this style" button is rendered for each set
    const buttons = screen.getAllByRole('button', { name: 'Choose this style' });
    expect(buttons).toHaveLength(4);
  });

  // Test 2: Simulate a user choosing an avatar set and verify the correct function is called.
  it('should call avatarSelected with the correct data when a style is chosen', async () => {
    render(AvatarSelector, { avatarSelected: mockAvatarSelected });

    // Get the "Choose this style" button for the 'robot' set
    const robotButton = screen.getAllByRole('button', { name: 'Choose this style' })[0];

    // Simulate a click event
    await fireEvent.click(robotButton);

    // Expect the loading state to be shown temporarily
    // expect(robotButton).toHaveTextContent('Loading…');

    // Wait for the async function to complete and the state to update
    await waitFor(() => {
      expect(robotButton).toHaveTextContent('Choose this style');
    });

    // Verify that the avatarSelected prop was called with the expected data
    expect(mockAvatarSelected).toHaveBeenCalledTimes(1);
    expect(mockAvatarSelected).toHaveBeenCalledWith({
      avatar: 'mock-url-robot-test-seed-128',
      name: 'MockName',
      set: 'robot',
      userId: expect.any(String) // We can't predict the userId, so we check its type
    });
  });

  // Test 3: Check that the avatar image URLs are generated correctly based on the mock function.
  it('should render correct preview images for each avatar set', () => {
    render(AvatarSelector, { avatarSelected: mockAvatarSelected });

    // Check the robot previews
    const robotImages = screen.getAllByAltText('robot preview');
    expect(robotImages).toHaveLength(4);
    robotImages.forEach((img) => {
      expect(img).toHaveAttribute('src', expect.stringContaining('mock-url-robot-test-seed-96'));
    });

    // Check the monster previews
    const monsterImages = screen.getAllByAltText('monster preview');
    expect(monsterImages).toHaveLength(4);
    monsterImages.forEach((img) => {
      expect(img).toHaveAttribute('src', expect.stringContaining('mock-url-monster-test-seed-96'));
    });
  });

  // Test 4: Verify that the component handles the loading state correctly.
  it('should handle the loading state by disabling the buttons', async () => {
    render(AvatarSelector, { avatarSelected: mockAvatarSelected });

    const buttons = screen.getAllByRole('button');

    // Click one of the buttons
    fireEvent.click(buttons[0]);

    // All buttons should be disabled while loading
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
    expect(buttons[2]).toBeDisabled();
    expect(buttons[3]).toBeDisabled();

    // Wait for the mock async function to resolve
    await waitFor(() => {
      expect(buttons[0]).not.toBeDisabled();
    });

    // After loading, all buttons should be enabled again
    expect(buttons[0]).not.toBeDisabled();
    expect(buttons[1]).not.toBeDisabled();
    expect(buttons[2]).not.toBeDisabled();
    expect(buttons[3]).not.toBeDisabled();
  });
});
