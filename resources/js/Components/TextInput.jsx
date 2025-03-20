import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                `block w-full rounded-md border-gray-300 shadow-sm transition duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 ` +
                className
            }
            ref={localRef}
        />
    );
});