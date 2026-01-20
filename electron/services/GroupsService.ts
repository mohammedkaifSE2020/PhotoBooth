import { getDatabase } from "../database/connection";
import log from "electron-log";

export interface Group {
    id: number;
    name: string;
    description?: string;
    photo_count: number;
    thumbnail_path?: string;
    created_at: string;
    updated_at: string;
}

interface CountResult {
    count: number;
}

export class GroupsService {
    private db = getDatabase();

    //Get all groups
    async getAllGroups(): Promise<Group[]> {
        try {
            const groups = this.db.prepare("SELECT * FROM groups").all();
            //check if groups is undefined or null
            if (!groups) {
                return [];
            }
            return groups as Group[];
        } catch (error) {
            log.error("Error fetching groups:", error);
            throw error;
        }
    }

    //Get group by id
    async getGroupById(id: number): Promise<Group | null> {
        try {
            const group = this.db.prepare("SELECT * FROM groups WHERE id = ?").get(id);
            return group ? (group as Group) : null;
        }
        catch (error) {
            log.error(`Error fetching group with id ${id}:`, error);
            throw error;
        }
    }

    //Create a new group
    async createGroup(name: string, description?: string, thumbnail_path?: string): Promise<number> {
        try {
            const group = this.db.prepare("INSERT INTO groups (name, description, thumbnail_path, photo_count, created_at, updated_at) VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))").run(name, description, thumbnail_path);
            return group.lastInsertRowid as number;
        } catch (error) {
            log.error("Error creating group:", error);
            throw error;
        }
    }

    //Update a group
    async updateGroup(id: number, updates: Partial<Omit<Group, 'id' | 'created_at' | 'photo_count'>>): Promise<void> {
        try {
            const updateFields: string[] = [];
            const values: any[] = [];
            if (updates.name !== undefined) {
                updateFields.push("name = ?");
                values.push(updates.name);
            }
            if (updates.description !== undefined) {
                updateFields.push("description = ?");
                values.push(updates.description);
            }
            if (updates.thumbnail_path !== undefined) {
                updateFields.push("thumbnail_path = ?");
                values.push(updates.thumbnail_path);
            }
            updateFields.push("updated_at = datetime('now')");
            values.push(id);
            const query = `UPDATE groups SET ${updateFields.join(", ")} WHERE id = ?`;
            this.db.prepare(query).run(...values);
        } catch (error) {
            log.error(`Error updating group with id ${id}:`, error);
            throw error;
        }
    }

    //Delete a group
    async deleteGroup(id: number): Promise<void> {
        try {
            this.db.prepare("DELETE FROM groups WHERE id = ?").run(id);
        } catch (error) {
            log.error(`Error deleting group with id ${id}:`, error);
            throw error;
        }
    }

    //Photos Crud operations will be here 

    //add photos to group
    async addPhotosToGroup(groupId: number, photoIds: number[]): Promise<void> {
        try {
            //validate all photoIds exist
            const insert = this.db.prepare("INSERT INTO group_photos (group_id, photo_id) VALUES (?, ?)");
            const insertMany = this.db.transaction((photoIds: number[]) => {
                for (const photoId of photoIds) {
                    insert.run(groupId, photoId);
                }
            });

            insertMany(photoIds);

        } catch (error) {
            log.error(`Error adding photos to group with id ${groupId}:`, error);
            throw error;
        }
    }

    //remove photos from group
    async removePhotosFromGroup(groupId: number, photoIds: number[]): Promise<void> {
        try {
            const deleteQuery = this.db.prepare("DELETE FROM group_photos WHERE group_id = ? AND photo_id IN (SELECT photo_id FROM group_photos WHERE group_id = ? AND photo_id IN (?))");
            const deleteMany = this.db.transaction((photoIds: number[]) => {
                for (const photoId of photoIds) {
                    deleteQuery.run(groupId, groupId, photoId);
                }
            });
            deleteMany(photoIds);
        } catch (error) {
            log.error(`Error removing photos from group with id ${groupId}:`, error);
            throw error;
        }
    }

    //get photos by group id
    async getPhotosByGroupId(groupId: number): Promise<number[]> {
        try {
            const photos = this.db.prepare("SELECT photo_id FROM group_photos WHERE group_id = ?").all(groupId);
            return photos.map((p: any) => p.photo_id);
        } catch (error) {
            log.error(`Error getting photos by group id ${groupId}:`, error);
            throw error;
        }
    }

    //update photo count for a group
    async updatePhotoCountForGroup(groupId: number): Promise<void> {
        try {
            // Cast the result to our interface
            const result = this.db
                .prepare("SELECT COUNT(*) as count FROM group_photos WHERE group_id = ?")
                .get(groupId) as CountResult | undefined;

            // Ensure result exists before accessing .count
            if (result) {
                this.db
                    .prepare("UPDATE groups SET photo_count = ? WHERE id = ?")
                    .run(result.count, groupId);
            }
        } catch (error) {
            // Handle the 'unknown' error type for logging
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error updating photo count for group id ${groupId}:`, errorMessage);
            throw error;
        }
    }

    
}