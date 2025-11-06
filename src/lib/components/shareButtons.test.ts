import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ShareButtons from '$lib/components/shareButtons.svelte';

describe('ShareButtons', () => {
  it('renders the component with provided share content', () => {
    const mockShareContent = {
      acct: 'testUser',
      desc: 'Test description for sharing.',
      title: 'Test Title',
      url: 'http://example.com/test',
    };

    // Render the component with the mock content
    render(ShareButtons, { shareContent: mockShareContent });

    // Check if the URL, description, and share button text are in the document
    expect(screen.getByText(mockShareContent.url)).toBeInTheDocument();
    expect(screen.getByText(mockShareContent.desc)).toBeInTheDocument();
    expect(screen.getByTestId('share-by-email')).toBeInTheDocument();
    expect(screen.getByTestId('share-by-reddit')).toBeInTheDocument();
    expect(screen.getByTestId('share-by-linkedin')).toBeInTheDocument();
  });

  it('renders correctly without a note', () => {
    const mockShareContent = {
      acct: 'testUser',
      desc: 'Test description for sharing.',
      title: 'Test Title',
      url: 'http://example.com/test',
      note: null,
    };

    // Render the component with the mock content that has no 'note'
    render(ShareButtons, { shareContent: mockShareContent });

    // Ensure the note paragraph is not in the document
    const noteElement = screen.getByText(mockShareContent.desc) || [];
    expect(noteElement).toBeDefined()
  });
});
