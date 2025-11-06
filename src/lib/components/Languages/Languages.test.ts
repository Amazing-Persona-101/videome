// Languages.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { setupI18nMock } from '$lib/tests/mocks/i18n';
import Languages from './Languages.svelte';

// Set up the i18n mock before all tests
setupI18nMock();

import { locale } from 'svelte-i18n';

// Mock the svelte-i18n store and the getLanguageList function
vi.mock('svelte-i18n', () => ({
    locale: {
        set: vi.fn(),
        subscribe: vi.fn()
    },
    _: vi.fn((key) => `Translated: ${key}`)
}));

vi.mock('./getLanguage', () => ({
    getLanguageList: vi.fn(() => [
        {
            group: 'A-D',
            languages: [
                { value: 'en', text: 'English' },
                { value: 'de', text: 'German' }
            ]
        },
        {
            group: 'E-H',
            languages: [
                { value: 'fr', text: 'French' }
            ]
        }
    ])
}));

describe('Languages.svelte', () => {
    // Reset mocks before each test
    beforeEach(() => {
        vi.clearAllMocks();
        locale.set('en');
    });

    it('should render the flags button with the correct attributes', () => {
        render(Languages);
        const button = screen.getByTestId('flags-button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('z-10 inline-flex shrink-0 items-center');
    });

    it('should open the dropdown menu when the button is clicked', async () => {
        render(Languages);
        const button = screen.getByTestId('flags-button');
        await fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Choose Language')).toBeInTheDocument();
        });
    });

    it('should display the correct language groups', async () => {
        render(Languages);
        const button = screen.getByTestId('flags-button');
        await fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('A-D')).toBeInTheDocument();
            expect(screen.getByText('E-H')).toBeInTheDocument();
        });
    });

    it('should call handleLocaleChange with the correct key when a language is selected', async () => {
        render(Languages);
        const button = screen.getByTestId('flags-button');
        await fireEvent.click(button);

        // Wait for the dropdown to open
        await waitFor(() => {
            expect(screen.getByText('Choose Language')).toBeInTheDocument();
        });

        // Click on the 'E-H' submenu
        const ehSubmenu = screen.getByText('E-H');
        await fireEvent.click(ehSubmenu);

        // Wait for the submenu to open and then click on 'French'
        await waitFor(async () => {
            const frenchItem = screen.getByText('French');
            await fireEvent.click(frenchItem);
        });

        // Check if locale.set was called with 'fr'
        expect(locale.set).toHaveBeenCalledWith('fr');
    });
});