# Offline Components

Components and utilities for handling offline state and managing operations that require internet connectivity.

## Components

### OfflineIndicator

Displays a banner when the user is offline with a counter of pending operations.

**Requirements:** 6.1, 6.2, 6.4, 6.5

**Usage:**
```tsx
import { OfflineIndicator } from '@/Components/Offline';

function App() {
  return (
    <>
      <YourContent />
      <OfflineIndicator />
    </>
  );
}
```

**Features:**
- Automatically shows/hides based on online status
- Displays count of pending operations
- Expandable to show more details
- Accessible with ARIA attributes

---

### PendingOperationsList

Displays a detailed list of pending operations with retry and discard actions.

**Requirements:** 6.5

**Usage:**
```tsx
import { PendingOperationsList } from '@/Components/Offline';

function OperationsModal() {
  return (
    <Modal>
      <h2>Pending Operations</h2>
      <PendingOperationsList />
    </Modal>
  );
}
```

**Features:**
- Shows all queued, syncing, failed, and completed operations
- Allows manual retry of failed operations
- Clear all failed operations
- Real-time updates every 2 seconds
- Visual status badges and icons

---

### OfflineDisabledWrapper

Wraps content and visually disables it when offline.

**Requirements:** 6.3

**Usage:**
```tsx
import { OfflineDisabledWrapper } from '@/Components/Offline';

function VideoPlayer() {
  return (
    <OfflineDisabledWrapper 
      requiresConnection={true}
      offlineMessage="Video streaming requires internet"
      showOfflineOverlay={true}
    >
      <video src="stream.mp4" />
    </OfflineDisabledWrapper>
  );
}
```

**Props:**
- `requiresConnection` (boolean): Whether the feature requires connection
- `offlineMessage` (string): Message to show when offline
- `showOfflineOverlay` (boolean): Whether to show overlay with message
- `className` (string): Additional CSS classes

---

### withOfflineDisable (HOC)

Higher-order component to automatically disable components when offline.

**Requirements:** 6.3

**Usage:**
```tsx
import { withOfflineDisable } from '@/Components/Offline';
import { Button } from '@/Components/ui/button';

const OfflineAwareButton = withOfflineDisable(Button);

function SubmitForm() {
  return (
    <OfflineAwareButton 
      requiresConnection={true}
      offlineTooltip="Submit requires internet connection"
    >
      Submit
    </OfflineAwareButton>
  );
}
```

**Props:**
- `requiresConnection` (boolean): Whether the component requires connection
- `offlineTooltip` (string): Tooltip message when disabled
- `disabledClassName` (string): CSS classes to apply when disabled

---

## Hooks

### useOfflineDisable

Hook that provides utilities to disable features when offline.

**Requirements:** 6.3

**Usage:**
```tsx
import { useOfflineDisable } from '@/Hooks/useOfflineDisable';

function StreamingButton() {
  const { isDisabled, disabledReason, offlineProps } = useOfflineDisable({
    requiresConnection: true,
    offlineMessage: 'Streaming requires internet',
  });

  return (
    <button {...offlineProps}>
      {isDisabled ? 'Offline' : 'Start Stream'}
    </button>
  );
}
```

**Returns:**
- `isDisabled` (boolean): Whether the feature is currently disabled
- `disabledReason` (string | null): Reason for being disabled
- `offlineProps` (object): Props to spread on components (disabled, title, aria-disabled)

---

## Examples

### Example 1: Disable form submission when offline

```tsx
import { useOfflineDisable } from '@/Hooks/useOfflineDisable';

function PublicationForm() {
  const { offlineProps } = useOfflineDisable({
    requiresConnection: true,
    offlineMessage: 'Publishing requires internet connection',
  });

  return (
    <form>
      <input type="text" name="title" />
      <button type="submit" {...offlineProps}>
        Publish
      </button>
    </form>
  );
}
```

### Example 2: Disable video streaming when offline

```tsx
import { OfflineDisabledWrapper } from '@/Components/Offline';

function VideoGallery() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {videos.map(video => (
        <OfflineDisabledWrapper
          key={video.id}
          requiresConnection={true}
          offlineMessage="Video streaming requires internet"
          showOfflineOverlay={true}
        >
          <VideoPlayer src={video.url} />
        </OfflineDisabledWrapper>
      ))}
    </div>
  );
}
```

### Example 3: Show offline indicator globally

```tsx
// In your main layout component
import { OfflineIndicator } from '@/Components/Offline';

function Layout({ children }) {
  return (
    <div>
      <Header />
      <main>{children}</main>
      <Footer />
      <OfflineIndicator />
    </div>
  );
}
```

### Example 4: Modal with pending operations list

```tsx
import { useState } from 'react';
import { OfflineIndicator, PendingOperationsList } from '@/Components/Offline';
import { useOffline } from '@/Hooks/useOffline';

function App() {
  const [showModal, setShowModal] = useState(false);
  const { pendingCount } = useOffline();

  return (
    <>
      <YourContent />
      
      {/* Clickable offline indicator */}
      <div onClick={() => pendingCount > 0 && setShowModal(true)}>
        <OfflineIndicator />
      </div>

      {/* Modal with operations list */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2>Pending Operations</h2>
          <PendingOperationsList />
        </Modal>
      )}
    </>
  );
}
```

---

## Testing

### Testing offline state

```tsx
import { render, screen } from '@testing-library/react';
import { OfflineIndicator } from '@/Components/Offline';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false,
});

test('shows offline indicator when offline', () => {
  render(<OfflineIndicator />);
  expect(screen.getByText("You're offline")).toBeInTheDocument();
});
```

### Testing disabled features

```tsx
import { render, screen } from '@testing-library/react';
import { useOfflineDisable } from '@/Hooks/useOfflineDisable';

function TestComponent() {
  const { offlineProps } = useOfflineDisable({ requiresConnection: true });
  return <button {...offlineProps}>Submit</button>;
}

test('disables button when offline', () => {
  Object.defineProperty(navigator, 'onLine', { value: false });
  render(<TestComponent />);
  expect(screen.getByRole('button')).toBeDisabled();
});
```

---

## Architecture

These components integrate with:
- `useOffline` hook for online/offline state
- `indexedDBQueue` for operation persistence
- `optimisticStore` for optimistic updates

They follow the design patterns established in the Optimistic UI and PWA specification.
