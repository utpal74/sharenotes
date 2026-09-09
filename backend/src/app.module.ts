import { Module } from '@nestjs/common';
import { NotesController } from './notes/notes.controller.js';
import { NotesService } from './notes/notes.service.js';

@Module({
  imports: [],
  controllers: [NotesController],
  providers: [NotesService],
})
export class AppModule { }
