import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { setupI18nMock } from '$lib/tests/mocks/i18n';
import GroupSelector from './GroupSelector.svelte';

// Set up the i18n mock before all tests
setupI18nMock();

import { locale } from 'svelte-i18n';

// Mock data to simulate the `groups` prop
const mockGroups = [
  { id: '1', name: 'Group A', iconURL: 'https://example.com/iconA.png' },
  { id: '2', name: 'Group B', iconURL: null },
  { id: '3', name: 'Group C', iconURL: 'https://example.com/iconC.png' }
];

describe('GroupSelector', () => {

  beforeEach(() => {
    // Set the locale before each test
    locale.set('en');
  });
  // A mock function for the `groupSelected` prop
  const mockGroupSelected = vi.fn();

  // Test 1: Check if the component renders correctly with the provided props.
  it('should render the component with group items and a description textarea', () => {
    render(GroupSelector, {
      groups: mockGroups,
      groupSelected: mockGroupSelected,
      summary: ''
    });

    // Check if the description textarea is present
    expect(screen.getByPlaceholderText('e.g., Weekly standup about release planning')).toBeInTheDocument();

    // Check if all group names are rendered
    mockGroups.forEach(group => {
      expect(screen.getByText(group.name)).toBeInTheDocument();
    });

    // Check for the presence of the icon and fallback initials
    expect(screen.getByRole('img', { name: 'Group A' })).toHaveAttribute('src', mockGroups[0].iconURL);
    expect(screen.getByRole('img', { name: 'Group C' })).toHaveAttribute('src', mockGroups[2].iconURL);
    expect(screen.getByTitle('Group B')).toBeInTheDocument(); // Checks for the fallback div
    expect(screen.getByText('GB')).toBeInTheDocument(); // Checks for the fallback initials
  });

  // Test 2: Simulate a user selecting a group and verify the `groupSelected` function is called.
  it('should call groupSelected with the correct group info when a group is clicked', async () => {
    render(GroupSelector, {
      groups: mockGroups,
      groupSelected: mockGroupSelected,
      summary: ''
    });

    // Find the button for "Group A" and click it
    const groupAButton = screen.getByRole('button', { name: /Group A/i });
    await fireEvent.click(groupAButton);

    // Verify `groupSelected` was called with the correct data
    expect(mockGroupSelected).toHaveBeenCalledTimes(1);
    expect(mockGroupSelected).toHaveBeenCalledWith(mockGroups[0]);

    // Verify the selected group button has the correct styling classes
    expect(groupAButton).toHaveClass('border-primary');
    expect(groupAButton).toHaveClass('bg-primary/10');
    expect(groupAButton).toHaveClass('ring-2');
    expect(groupAButton).toHaveAttribute('aria-pressed', 'true');
  });

  // Test 3: Check if the summary field correctly updates the bound value.
  it('should update the summary state when the textarea is typed into', async () => {
    const { component } = render(GroupSelector, {
      groups: mockGroups,
      groupSelected: mockGroupSelected,
      summary: 'Initial summary'
    });

    const textarea = screen.getByPlaceholderText('e.g., Weekly standup about release planning') as HTMLTextAreaElement;

    // Verify the initial value
    expect(textarea.value).toBe('Initial summary');

    // Simulate typing in the textarea
    await fireEvent.input(textarea, { target: { value: 'New summary text' } });

    // Verify the bound value is updated on the element itself
    expect(textarea.value).toBe('New summary text');
    expect(screen.getByText('New summary text'.length + '/140')).toBeInTheDocument();
  });

  // Test 4: Verify the initialsFor function works correctly
  it('should generate correct initials for a group name', () => {
    // Since initialsFor is a function inside the component, we can't directly test it.
    // Instead, we verify its output indirectly through the rendered fallback content.
    render(GroupSelector, {
      groups: mockGroups,
      groupSelected: mockGroupSelected,
      summary: ''
    });
    // The mock group "Group B" has no icon, so it should render initials "GB"
    expect(screen.getByText('GB')).toBeInTheDocument();
  });

});
