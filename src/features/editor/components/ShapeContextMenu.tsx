// src/features/editor/components/ShapeContextMenu.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import {
    ContentCopy,
    Delete,
    DriveFileMove
} from '@mui/icons-material';
import { useEditor } from '../../../contexts/editor';

interface ShapeContextMenuProps {
    // no props—everything comes from context
}

const ShapeContextMenuWithSubmenu: React.FC<ShapeContextMenuProps> = () => {
    const {
        contextMenu,
        closeContextMenu,
        moveShapesToEntity,
        dispatch,
        state
    } = useEditor();

    const { isOpen, position, selectedShapeIds, selectedEntityId } = contextMenu;

    // Anchor for the "Move to →" submenu
    const [moveToAnchorEl, setMoveToAnchorEl] = useState<null | HTMLElement>(null);

    // Build sorted list of all other entities
    const availableEntities = useMemo(() => {
        const arr: Array<{ id: string; name: string }> = [];
        for (const [entityId, entity] of Object.entries(state.entities)) {
            if (entityId !== selectedEntityId) {
                arr.push({
                    id: entityId,
                    name: entity.metaData.entityName || entityId
                });
            }
        }
        return arr.sort((a, b) => a.name.localeCompare(b.name));
    }, [state.entities, selectedEntityId]);

    // Duplicate handler
    const handleDuplicate = useCallback(() => {
        if (!selectedEntityId) return;
        const ids = Array.from(selectedShapeIds);
        ids.forEach((shapeId) => {
            dispatch({
                type: 'DUPLICATE_SHAPE',
                payload: {
                    entityId: selectedEntityId,
                    shapeId,
                    offset: { x: 20, y: 20 }
                }
            });
        });
        closeContextMenu();
    }, [dispatch, selectedEntityId, selectedShapeIds, closeContextMenu]);

    // Delete handler
    const handleDelete = useCallback(() => {
        if (!selectedEntityId) return;
        const ids = Array.from(selectedShapeIds);
        const text = ids.length === 1 ? 'shape' : 'shapes';

        if (confirm(`Are you sure you want to delete ${ids.length} ${text}?`)) {
            ids.forEach((shapeId) => {
                dispatch({
                    type: 'DELETE_SHAPE',
                    payload: {
                        entityId: selectedEntityId,
                        shapeId
                    }
                });
            });
        }
        closeContextMenu();
    }, [dispatch, selectedEntityId, selectedShapeIds, closeContextMenu]);

    // Called when the user hovers or focuses on “Move to”
    const handleMoveToOpen = useCallback((e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
        setMoveToAnchorEl(e.currentTarget);
    }, []);

    // Move shapes into the chosen entity
    const handleMoveToEntity = useCallback(
        (targetEntityId: string) => {
            if (!selectedEntityId) return;
            const ids = Array.from(selectedShapeIds);
            moveShapesToEntity(selectedEntityId, targetEntityId, ids);
            setMoveToAnchorEl(null);
            closeContextMenu();
        },
        [moveShapesToEntity, selectedEntityId, selectedShapeIds, closeContextMenu]
    );

    // Close both the main context menu and submenu
    const handleCloseAll = useCallback(() => {
        setMoveToAnchorEl(null);
        closeContextMenu();
    }, [closeContextMenu]);

    // Close only the submenu (keep the main menu open)
    const handleMoveToClose = useCallback(() => {
        setMoveToAnchorEl(null);
    }, []);

    if (!isOpen || selectedShapeIds.size === 0) {
        return null;
    }

    const selectedCount = selectedShapeIds.size;
    const isMultiple = selectedCount > 1;

    return (
        <>
            {/* =====================
            Main Context Menu
      ===================== */}
            <Menu
                open={isOpen}
                onClose={handleCloseAll}
                anchorReference="anchorPosition"
                anchorPosition={{
                    top: position.y,
                    left: position.x
                }}
                slotProps={{
                    paper: {
                        sx: { minWidth: 200 }
                    }
                }}
            >
                {/* Header showing how many shapes are selected */}
                <MenuItem disabled>
                    <ListItemText
                        primary={`${selectedCount} shape${isMultiple ? 's' : ''} selected`}
                        style={{ fontWeight: 'bold' }}
                    />
                </MenuItem>

                <Divider />

                {/* Duplicate */}
                <MenuItem onClick={handleDuplicate}>
                    <ListItemIcon>
                        <ContentCopy fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={`Duplicate ${isMultiple ? 'shapes' : 'shape'}`} />
                </MenuItem>

                {/* “Move to →” opens the submenu on hover or focus */}
                {availableEntities.length > 0 && (
                    <MenuItem
                        // When the MenuItem is hovered, open the submenu
                        onMouseEnter={handleMoveToOpen}
                        // When keyboard-focus lands here, open the submenu
                        onFocus={handleMoveToOpen}
                        // If the mouse leaves this item and the submenu isn't open, close it
                        onMouseLeave={() => {
                            // If submenu is already open, do nothing. Otherwise, close.
                            if (!moveToAnchorEl) {
                                handleMoveToClose();
                            }
                        }}
                    >
                        <ListItemIcon>
                            <DriveFileMove fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Move to" />
                        {/* Right-arrow indicator */}
                        <span style={{ marginLeft: 'auto' }}>›</span>
                    </MenuItem>
                )}

                <Divider />

                {/* Delete */}
                <MenuItem onClick={handleDelete} style={{ color: '#d32f2f' }}>
                    <ListItemIcon>
                        <Delete fontSize="small" style={{ color: '#d32f2f' }} />
                    </ListItemIcon>
                    <ListItemText primary={`Delete ${isMultiple ? 'shapes' : 'shape'}`} />
                </MenuItem>
            </Menu>

            {/* =====================
            Submenu: “Move to …”
      ===================== */}
            <Menu
                anchorEl={moveToAnchorEl}
                open={Boolean(moveToAnchorEl)}
                onClose={handleMoveToClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                slotProps={{
                    paper: {
                        sx: { minWidth: 160 }
                    }
                }}
                // If the user hovers out of the submenu itself, close it
                MenuListProps={{
                    onMouseLeave: handleMoveToClose
                }}
            >
                {availableEntities.map(entity => (
                    <MenuItem
                        key={entity.id}
                        onClick={() => handleMoveToEntity(entity.id)}
                    >
                        <ListItemText primary={entity.name} />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default ShapeContextMenuWithSubmenu;
