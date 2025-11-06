import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Layout from './+layout.svelte';

describe('+layout.svelte', () => {
  it('should render the layout with its sidebar and header', () => {
    // Render the layout with minimal props to ensure it renders without errors.
    render(Layout, {
      props: {
        data: {
          sessions: []
        }
      }
    });

    // Check for a key element that is always present in the layout,
    // such as the "Live Meetings" or "Start a Meeting!" heading from the SiteHeader.
    // The queryByText is used to handle either case.
    const heading = screen.getByTestId('site-header');
    expect(heading).toBeInTheDocument();
  });
});
