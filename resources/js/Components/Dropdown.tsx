import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, ComponentProps } from 'react';
import { Transition } from '@headlessui/react';
import { Link as InertiaLink } from '@inertiajs/react'; // Renamed Link to InertiaLink, removed LinkProps

interface DropDownContextType {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    toggleOpen: () => void;
}

const DropDownContext = createContext<DropDownContextType | undefined>(undefined);

interface DropdownProps {
    children: ReactNode;
}

const Dropdown = ({ children }: DropdownProps) => {
    const [open, setOpen] = useState<boolean>(false);

    const toggleOpen = () => {
        setOpen((previousState) => !previousState);
    };

    return (
        <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
            <div className="relative">{children}</div>
        </DropDownContext.Provider>
    );
};

interface TriggerProps {
    children: ReactNode;
}

const Trigger = ({ children }: TriggerProps) => {
    const context = useContext(DropDownContext);
    if (!context) {
        throw new Error("Trigger must be used within a DropdownProvider");
    }
    const { toggleOpen, open, setOpen } = context;

    return (
        <>
            <div onClick={toggleOpen}>{children}</div>
            {open && <div className="fixed inset-0 z-20" onClick={() => setOpen(false)}></div>}
        </>
    );
};

interface ContentProps {
    align?: 'left' | 'right';
    width?: '48' | string; // Allow other string values for width
    contentClasses?: string;
    children: ReactNode;
}

const Content = ({
    align = 'right',
    width = '86',
    contentClasses = 'py-4 mt-3 bg-gray-50 font-bold block text-center',
    children,
}: ContentProps) => {
    const context = useContext(DropDownContext);
    if (!context) {
        throw new Error("Content must be used within a DropdownProvider");
    }
    const { open, setOpen } = context;

    let alignmentClasses = 'origin-top';
    if (align === 'left') {
        alignmentClasses = 'ltr:origin-top-left rtl:origin-top-right start-0';
    } else if (align === 'right') {
        alignmentClasses = 'ltr:origin-top-right rtl:origin-top-left end-0';
    }

    let widthClasses = '';
    if (width === '48') {
        widthClasses = 'w-48';
    } else if (width) {
        widthClasses = `w-${width}`; // Example for custom width
    }

    return (
        <Transition
            show={open}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
        >
            <div
                className={`absolute rounded-md shadow-xl ${alignmentClasses} ${widthClasses}`}
                onClick={() => setOpen(false)}
            >
                <div className={`rounded-md ring-1 ring-black ring-opacity-5 
                        ${contentClasses}`}>
                    {children}
                </div>
            </div>
        </Transition>
    );
};

// Extending ComponentProps<typeof InertiaLink> for DropdownLink
interface DropdownLinkProps extends ComponentProps<typeof InertiaLink> {
    className?: string;
    children: ReactNode;
    // href is already part of ComponentProps<typeof InertiaLink> if it's a valid prop for InertiaLink
}

const DropdownLink = ({ className = '', children, ...props }: DropdownLinkProps) => {
    return (
        <InertiaLink
            {...props} 
            className={
                'block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ' +
                className
            }
        >
            {children}
        </InertiaLink>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink; // This is the sub-component

export default Dropdown;
