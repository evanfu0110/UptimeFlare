import { useMantineColorScheme } from '@mantine/core';
import { useEffect } from 'react';
import moment from 'moment';

export function TimeAutoSwitch() {
    const { colorScheme } = useMantineColorScheme();

    useEffect(() => {
        // Only run logic if in auto mode
        if (colorScheme !== 'auto') return;

        const checkTime = () => {
            // Shanghai is UTC+8
            // We use moment to handle offset explicitly
            const now = moment().utcOffset(8);
            const hour = now.hour();

            // Dark mode from 18:00 (6 PM) to 06:00 (6 AM)
            const isDark = hour >= 18 || hour < 6;
            const targetScheme = isDark ? 'dark' : 'light';

            const currentAttribute = document.documentElement.getAttribute('data-mantine-color-scheme');

            // Only update if different to avoid unnecessary DOM writes/repaints
            // Note: When colorScheme is 'auto', Mantine normally sets this based on system preference.
            // We override it here.
            if (currentAttribute !== targetScheme) {
                document.documentElement.setAttribute('data-mantine-color-scheme', targetScheme);
            }
        };

        // Run immediately on mount/change to auto
        checkTime();

        // Check every minute
        const interval = setInterval(checkTime, 60000);

        return () => clearInterval(interval);
    }, [colorScheme]);

    return null;
}
