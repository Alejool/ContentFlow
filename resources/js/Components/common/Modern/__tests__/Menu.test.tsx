import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Edit, Trash } from 'lucide-react';
import { Button } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import Menu from '../Menu';

describe('Menu Component', () => {
  it('renders trigger button', () => {
    render(
      <Menu trigger={<Button>Acciones</Button>} onAction={() => {}}>
        <Menu.Item key="edit">Editar</Menu.Item>
      </Menu>,
    );

    expect(screen.getByRole('button', { name: /acciones/i })).toBeInTheDocument();
  });

  it('opens menu on trigger click', async () => {
    const user = userEvent.setup();

    render(
      <Menu trigger={<Button>Acciones</Button>} onAction={() => {}}>
        <Menu.Item key="edit">Editar</Menu.Item>
        <Menu.Item key="delete">Eliminar</Menu.Item>
      </Menu>,
    );

    const trigger = screen.getByRole('button', { name: /acciones/i });
    await user.click(trigger);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /eliminar/i })).toBeInTheDocument();
  });

  it('calls onAction when menu item is clicked', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();

    render(
      <Menu trigger={<Button>Acciones</Button>} onAction={handleAction}>
        <Menu.Item key="edit">Editar</Menu.Item>
        <Menu.Item key="delete">Eliminar</Menu.Item>
      </Menu>,
    );

    const trigger = screen.getByRole('button', { name: /acciones/i });
    await user.click(trigger);

    const editItem = screen.getByRole('menuitem', { name: /editar/i });
    await user.click(editItem);

    expect(handleAction).toHaveBeenCalledWith('edit');
  });

  it('renders menu items with icons', async () => {
    const user = userEvent.setup();

    render(
      <Menu trigger={<Button>Acciones</Button>} onAction={() => {}}>
        <Menu.Item key="edit" icon={Edit}>
          Editar
        </Menu.Item>
        <Menu.Item key="delete" icon={Trash}>
          Eliminar
        </Menu.Item>
      </Menu>,
    );

    const trigger = screen.getByRole('button', { name: /acciones/i });
    await user.click(trigger);

    // Icons should be rendered
    const editItem = screen.getByRole('menuitem', { name: /editar/i });
    expect(editItem.querySelector('svg')).toBeInTheDocument();
  });

  it('applies danger variant styling', async () => {
    const user = userEvent.setup();

    render(
      <Menu trigger={<Button>Acciones</Button>} onAction={() => {}}>
        <Menu.Item key="delete" variant="danger">
          Eliminar
        </Menu.Item>
      </Menu>,
    );

    const trigger = screen.getByRole('button', { name: /acciones/i });
    await user.click(trigger);

    const deleteItem = screen.getByRole('menuitem', { name: /eliminar/i });
    expect(deleteItem).toHaveClass('text-red-600');
  });

  it('renders separator', async () => {
    const user = userEvent.setup();

    render(
      <Menu trigger={<Button>Acciones</Button>} onAction={() => {}}>
        <Menu.Item key="edit">Editar</Menu.Item>
        <Menu.Separator />
        <Menu.Item key="delete">Eliminar</Menu.Item>
      </Menu>,
    );

    const trigger = screen.getByRole('button', { name: /acciones/i });
    await user.click(trigger);

    const separator = screen.getByRole('separator');
    expect(separator).toBeInTheDocument();
  });
});
