import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    Param,
    Patch,
    Post,
    Query,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { NotesService } from './notes.service.js';
import type { CreateNoteInput, UpdateNoteInput } from './notes.types.js';

@Controller()
export class NotesController {
    constructor(private readonly notesService: NotesService) { }

    @Post('notes')
    create(@Body() input: CreateNoteInput, @Headers('x-user-id') userId?: string) {
        return this.notesService.create(input, userId);
    }

    @Get('notes')
    list(
        @Query('limit') limit = '20',
        @Query('offset') offset = '0',
        @Headers('x-user-id') userId?: string,
    ) {
        return this.notesService.list(userId, Number(limit), Number(offset));
    }

    @Get('notes/:noteId')
    get(@Param('noteId') noteId: string, @Headers('x-user-id') userId?: string) {
        return this.notesService.getOwned(noteId, userId);
    }

    @Patch('notes/:noteId')
    update(
        @Param('noteId') noteId: string,
        @Body() input: UpdateNoteInput,
        @Headers('x-user-id') userId?: string,
    ) {
        return this.notesService.update(noteId, input, userId);
    }

    @Delete('notes/:noteId')
    @HttpCode(204)
    remove(@Param('noteId') noteId: string, @Headers('x-user-id') userId?: string): void {
        this.notesService.remove(noteId, userId);
    }

    @Post('notes/:noteId/share')
    share(@Param('noteId') noteId: string, @Headers('x-user-id') userId?: string) {
        const link = this.notesService.createShareLink(noteId, userId);
        return { ...link, shareUrl: `/shared/${link.token}` };
    }

    @Delete('notes/:noteId/share/:token')
    @HttpCode(204)
    revoke(
        @Param('noteId') noteId: string,
        @Param('token') token: string,
        @Headers('x-user-id') userId?: string,
    ): void {
        this.notesService.revokeShareLink(noteId, token, userId);
    }

    @Get('shared/:token')
    shared(@Param('token') token: string, @Res({ passthrough: true }) response: Response) {
        const note = this.notesService.getShared(token);
        response.setHeader('Cache-Control', 'no-cache, must-revalidate');
        response.setHeader('ETag', `"note-${note.id}-${note.version}"`);
        return { id: note.id, title: note.title, content: note.content, version: note.version, updatedAt: note.updatedAt };
    }
}
