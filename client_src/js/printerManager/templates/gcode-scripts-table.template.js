export function customGcodeScriptTemplate(scripts, scriptLines) {
  return `<tr id="scriptRow-${scripts._id}">
    <td id="script_id_${scripts._id}" class="d-none">
      ${scripts._id}
    </td>
    <td>
      <input
        type="text"
        class="form-control"
        id="script_name_${scripts._id}"
        placeholder="${scripts.name}"
        disabled
      ></input>
    </td>
    <td>
      <input
        type="text"
        class="form-control"
        id="script_desc_${scripts._id}"
        placeholder="${scripts.description}"
        disabled
      ></input>
    </td>
    <td>
      <textarea
        type="text"
        class="form-control"
        id="script_lines_${scripts._id}"
        placeholder="${scriptLines}"
        disabled
      ></textarea>
    </td>
    <td>
      <button
        id="editScript-${scripts._id}"
        type="button"
        class="btn btn-sm btn-info edit bg-colour-1"
      >
        <i class="fas fa-edit editIcon"></i>
      </button>
      <button
        id="saveScript-${scripts._id}"
        type="button"
        class="btn btn-sm btn-success save bg-colour-2 d-none"
      >
        <i class="fas fa-save saveIcon"></i>
      </button>
      <button
        id="deleteScript-${scripts._id}"
        type="button"
        class="btn btn-sm btn-danger delete"
      >
        <i class="fas fa-trash deleteIcon"></i>
      </button>
    </td>
  </tr>`;
}
