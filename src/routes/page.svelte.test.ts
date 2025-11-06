import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import { setupI18nMock } from '$lib/tests/mocks/i18n';
import Page from './+page.svelte';

// Set up the i18n mock before all tests
setupI18nMock();

import { locale } from 'svelte-i18n';

describe('+page.svelte', () => {

  beforeEach(() => {
    // Set the locale before each test
    locale.set('en');
  });

  it('should render the basic page header without errors', () => {
    // This test ensures the component mounts and renders.
    // We can check for a key element to confirm it's working.
    render(Page);

    // The component shows either "Start a Meeting!" or "Live Meetings"
    // depending on the state. We'll check for both possibilities
    // to ensure it renders one of them.
    const heading = screen.getByText(/Start a Meeting!|Live Meetings/i);
    expect(heading).toBeInTheDocument();
  });
});
