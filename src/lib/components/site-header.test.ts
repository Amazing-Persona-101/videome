import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SiteHeader from '$lib/components/site-header.svelte';

describe('SiteHeader', () => {
  it('renders the header title correctly', () => {
    // Render the component
    render(SiteHeader, { onStartVideoButtonClick: () => { } });

    // Check if the title "Meetings" is in the document
    expect(screen.getByText('Live Meetings')).toBeInTheDocument();
  });

  it('calls onStartVideoButtonClick when the button is clicked', async () => {
    // Create a mock function to track calls
    const mockOnStartVideoClick = vi.fn();

    // Render the component with the mock function as a prop
    render(SiteHeader, { onStartVideoButtonClick: mockOnStartVideoClick });

    // Get the button by its test ID
    const startVideoButton = screen.getByTestId('header-start-video-button');

    // Simulate a click event on the button
    await fireEvent.click(startVideoButton);

    // Assert that the mock function was called exactly once
    expect(mockOnStartVideoClick).toHaveBeenCalledTimes(1);
  });
});
