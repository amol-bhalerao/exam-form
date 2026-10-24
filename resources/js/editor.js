import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// Rich text editor for CMS pages and notices. Each [data-editor] is a hidden textarea.
document.querySelectorAll('textarea[data-editor]').forEach((textarea) => {
    const holder = document.createElement('div');
    holder.className = 'bg-white min-h-[320px] text-base';
    textarea.insertAdjacentElement('beforebegin', holder);
    textarea.hidden = true;
    const quill = new Quill(holder, {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ header: [2, 3, false] }],
                ['bold', 'italic', 'underline', 'link'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote', 'image', 'clean'],
            ],
        },
    });
    quill.root.innerHTML = textarea.value;
    quill.on('text-change', () => { textarea.value = quill.root.innerHTML; });
});
