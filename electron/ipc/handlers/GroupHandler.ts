import { ipcMain } from "electron";
import log from "electron-log";
import { GroupsService } from "../../services/GroupsService";
import { Group } from "../../services/GroupsService";

export function registerGroupHandlers(): void {
    const groupsService = new GroupsService();

    // Handle get all groups
    ipcMain.handle("groups:getAll", async () => {
        try {
            return await groupsService.getAllGroups();
        } catch (error: any) {
            log.error("Error getting all groups:", error);
            throw new Error(error.message);
        }
    });

    // Handle get group by id
    ipcMain.handle("groups:getById", async (_, id: number) => {
        try {
            return await groupsService.getGroupById(id);
        } catch (error: any) {
            log.error(`Error getting group by id ${id}:`, error);
            throw new Error(error.message);
        }
    });

    // Handle create group
    ipcMain.handle("groups:create", async (_, name: string, description?: string, thumbnail_path?: string) => {
        try {
            return await groupsService.createGroup(name, description, thumbnail_path);
        } catch (error: any) {
            log.error("Error creating group:", error);
            throw new Error(error.message);
        }
    });

    // Handle update group
    ipcMain.handle("groups:update", async (_, id: number, updates: Partial<Omit<Group, "id" | "created_at" | "photo_count">>) => {
        try {
            await groupsService.updateGroup(id, updates);
        } catch (error: any) {
            log.error(`Error updating group with id ${id}:`, error);
            throw new Error(error.message);
        }
    });

    // Handle delete group
    ipcMain.handle("groups:delete", async (_, id: number) => {
        try {
            await groupsService.deleteGroup(id);
        } catch (error: any) {
            log.error(`Error deleting group with id ${id}:`, error);
            throw new Error(error.message);
        }
    });

    // Handle update photo count for group
    ipcMain.handle("groups:updatePhotoCount", async (_, groupId: number) => {
        try {
            await groupsService.updatePhotoCountForGroup(groupId);
        } catch (error: any) {
            log.error(`Error updating photo count for group with id ${groupId}:`, error);
            throw new Error(error.message);
        }
    });

    //add photos to group
    ipcMain.handle("groups:addPhotos", async (_, groupId: number, photoIds: number[]) => {
        try {
            await groupsService.addPhotosToGroup(groupId, photoIds);
        } catch (error: any) {
            log.error(`Error adding photos to group with id ${groupId}:`, error);
            throw new Error(error.message);
        }
    });

    //remove photos from group
    ipcMain.handle("groups:removePhotos", async (_, groupId: number, photoIds: number[]) => {
        try {
            await groupsService.removePhotosFromGroup(groupId, photoIds);
        } catch (error: any) {
            log.error(`Error removing photos from group with id ${groupId}:`, error);
            throw new Error(error.message);
        }
    });

    //get photos in group
    ipcMain.handle("groups:getPhotos", async (_, groupId: number) => {
        try {
            return await groupsService.getPhotosByGroupId(groupId);
        } catch (error: any) {
            log.error(`Error getting photos in group with id ${groupId}:`, error);
            throw new Error(error.message);
        }
    });
}