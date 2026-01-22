import { ActionIcon, Menu, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconClock } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light');
    const [mounted, setMounted] = useState(false);

    // We use this state to track the "intended" mode: 'light', 'dark', or 'auto'
    // Since Mantine's setColorScheme only supports 'light' | 'dark' | 'auto', we can rely on it directly.
    // However, we want 'auto' to mean "Shanghai Time", not just "System Preference".
    // For the UI, we just need to know which one is active.

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <ActionIcon variant="default" size="lg" aria-label="Toggle color scheme"><IconSun size={18} /></ActionIcon>;
    }

    const icon = colorScheme === 'auto' ? (
        <IconClock size={18} />
    ) : colorScheme === 'dark' ? (
        <IconMoon size={18} />
    ) : (
        <IconSun size={18} />
    );

    return (
        <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
                <ActionIcon variant="default" size="lg" aria-label="Toggle color scheme">
                    {icon}
                </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Label>Theme</Menu.Label>
                <Menu.Item
                    leftSection={<IconSun size={14} />}
                    onClick={() => setColorScheme('light')}
                    data-active={colorScheme === 'light'}
                    bg={colorScheme === 'light' ? 'var(--mantine-color-blue-light)' : undefined}
                >
                    Light
                </Menu.Item>
                <Menu.Item
                    leftSection={<IconMoon size={14} />}
                    onClick={() => setColorScheme('dark')}
                    data-active={colorScheme === 'dark'}
                    bg={colorScheme === 'dark' ? 'var(--mantine-color-blue-light)' : undefined}
                >
                    Dark
                </Menu.Item>
                <Menu.Item
                    leftSection={<IconClock size={14} />}
                    onClick={() => setColorScheme('auto')}
                    data-active={colorScheme === 'auto'}
                    bg={colorScheme === 'auto' ? 'var(--mantine-color-blue-light)' : undefined}
                >
                    Auto (Shanghai Time)
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}
