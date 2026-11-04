
import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Heading,
  List
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

const TextEditor = ({ value, onChange }) => {
  return (
    <CKEditor
      editor={ClassicEditor}
      config={{
        licenseKey: 'GPL',
        plugins: [
          Essentials,
          Paragraph,
          Bold,
          Italic,
          Heading,
          List
        ],
        toolbar: [
          'undo',
          'redo',
          '|',
          'heading',
          '|',
          'bold',
          'italic',
          '|',
          'bulletedList',
          'numberedList'
        ]
      }}
      data={value}
      onChange={(event, editor) => {
        onChange(editor.getData());
      }}
    />
  );
};

export default TextEditor;