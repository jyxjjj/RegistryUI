function buildTableRows(dataArr) {
    return dataArr.map(({ repo, tag, arch, hash, size, created }) => `
        <tr>
            <td>${repo}</td>
            <td>${tag}</td>
            <td class="text-center">${arch}</td>
            <td class="text-center">${hash}</td>
            <td class="text-center">${size}</td>
            <td class="text-center">${created}</td>
            <td class="text-center">
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteTag('${repo}','${tag}')">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        </tr>
    `).join('').replaceAll('\n', '').replaceAll('    ', '');
}

module.exports = { buildTableRows };
