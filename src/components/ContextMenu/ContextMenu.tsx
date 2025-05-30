import React from 'react';
import { Menu, MenuItem } from '@mui/material';

export default function ContextMenu() {
    const [menuPos, setMenuPos] = React.useState<{ mouseX: number; mouseY: number } | null>(null);

    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        setMenuPos({
            mouseX: event.clientX + 2,
            mouseY: event.clientY + 4,
        });
    };

    const handleClose = () => {
        setMenuPos(null);
    };

    return (
        <div
            onContextMenu={handleContextMenu}
            style={{ width: 400, height: 200, border: '1px solid #ccc' }}
        >
            <p>Right-click anywhere in this box to open the menu.</p>

            <Menu
                open={menuPos !== null}
                onClose={handleClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    menuPos !== null
                        ? { top: menuPos.mouseY, left: menuPos.mouseX }
                        : undefined
                }
            >
                <MenuItem onClick={handleClose}>Action One</MenuItem>
                <MenuItem onClick={handleClose}>Action Two</MenuItem>
                <MenuItem onClick={handleClose}>Action Three</MenuItem>
            </Menu>
        </div>
    );
}
