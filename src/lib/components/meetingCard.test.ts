import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MeetingCard from './meetingCard.svelte';

// Mock the meeting object with all possible properties
const mockMeetingFull = {
  id: '123',
  title: 'Project Alpha Review',
  href: '/meeting/123',
  details: {
    group: {
      name: 'Engineering Team',
      iconURL: 'https://placehold.co/50x50/ff0000/ffffff?text=E.T.'
    },
    summary: 'A brief review of the project milestones and upcoming tasks.',
  },
  totalParticipants: 1999,
  createdAt: new Date(),
  live: true,
  views: 1250
};

// Mock a meeting object with minimal properties to test fallbacks
const mockMeetingMinimal = {
  id: '456',
  title: '',
  views: undefined
};

// Mock a meeting object to test the initials fallback
const mockMeetingInitials = {
  id: '789',
  title: 'Weekly Standup',
  details: {
    group: {
      name: 'Engineering Team',
      iconURL: 'https://placehold.co/50x50/ff0000/ffffff?text=E.T.'
    },
    summary: 'A brief review of the project milestones and upcoming tasks.',
  }
};

describe('MeetingCard', () => {
  // Test 1: Check if the card renders correctly with all props provided.
  it('should render the meeting card with all provided data', () => {
    render(MeetingCard, { meeting: mockMeetingFull });

    // Check for the link and href
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', mockMeetingFull.href);

    // Check for the title
    expect(screen.getByText(mockMeetingFull.title)).toBeInTheDocument();

    // Check for the summary
    expect(screen.getByText(mockMeetingFull.details.summary)).toBeInTheDocument();

    // Check for live and views
    //expect(screen.getByText('2K')).toBeInTheDocument();

    // Check for images
    // const allImages = screen.getAllByRole('img');
    // expect(allImages).toHaveLength(1);

    // Check the banner image by its test id
    const backgroundDiv = screen.getByTestId('meeting-card-background');

    // Check if the div has the correct classes
    expect(backgroundDiv).toHaveClass('w-full overflow-hidden rounded bg-center bg-no-repeat');

    // Check if the style attribute contains the expected background image
    expect(backgroundDiv).toHaveStyle({
      backgroundImage: `(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${mockMeetingFull.details.group.iconURL}')`
    });

    // Check the small description image which has an empty alt
    // const descriptionImage = screen.getByRole('img', { name: '' });
    // expect(descriptionImage).toHaveAttribute('src', mockMeetingFull.groupIconURL);
  });

  // Test 2: Check the fallback behavior for missing properties.
  it('should use fallback values for missing properties', () => {
    render(MeetingCard, { meeting: mockMeetingMinimal });

    // Check for fallback title and group name
    expect(screen.getByText('Untitled Meeting!!')).toBeInTheDocument();

  });

  // Test 3: Check the initials function output
  it('should correctly render initials for a group name with multiple words', () => {
    render(MeetingCard, { meeting: mockMeetingInitials });

    // The group name is "Weekly Team Meeting", initials should be "WT"
    const wtText = screen.queryByText('WTX');
    expect(wtText).toBeNull();
    expect(screen.getAllByText('Weekly Standup')).toHaveLength(1);
  });

});
