let memoryInfo = (() => {

    let divMemories;
    window.onload = (function(){
        divMemories = document.querySelector('#divMemories');
    })();

    function _loadMemory() {
        if(typeof loginUser !== 'undefined' && loginUser !== null){
            const xhr = new XMLHttpRequest();
            xhr.open("GET", `/memories`, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.send();
            xhr.addEventListener('load', function() {
                var res = JSON.parse(xhr.responseText);
                
                dynamicMap.getSavedPlaceMarker(res);
                arrangeLoadedMemories(res);
            });
        } else {
            location.href = '/';
        }
    }

    function _loadKeyword() {
        if(typeof loginUser !== 'undefined' && loginUser !== null){
            const xhr = new XMLHttpRequest();
            xhr.open("GET", `/memories/keywords`, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.send();
            xhr.addEventListener('load', function() {
                var res = JSON.parse(xhr.responseText);
                arrangeLoadedKeywords(res);
            });
        } else {
            location.href = '/';
        }
    }

    function arrangeLoadedMemories(res) {
        const divMemories = document.querySelector('#divMemories');
        if(divMemories.querySelector('#memList') != null) {
            divMemories.querySelector('#memList').remove();
            divMemories.querySelector('#noList').style.display = 'block';
        }
        if(res.length > 0) {
            divMemories.querySelector('#noList').style.display = 'none';
            let html = '';
            html += '<div id="memList">';
            for(let i=0; i<res.length; i++){
                html += getMemoriesForm(res[i]);
            }
            html += '</div>';
            divMemories.insertAdjacentHTML('afterbegin', html);

            divMemories.querySelector('#memList').addEventListener('click', function(e) {
                if(e.target !== divMemories.querySelector('#memList')){
                    const id = e.target.closest('.memBox').dataset.memId;
                    let data = '';
                    for(let i=0; i<this.length; i++){
                        if(Number(id) === this[i].id){
                            data = this[i];
                            break;
                        }
                    }
                    memoryModal.getMemoryModal(data);
                }
            }.bind(res));
        }
    }

    function getMemoriesForm(data) {
        let html = `
        <div class="card mb-4 memBox" data-mem-id="${data.id}" style="cursor: pointer;">
            <div style="max-height:300px; overflow:hidden;">
                <img class="card-img-top" src=${data.path || '/img/noimage.jpg'} alt='/img/noimage.jpg'>
            </div>
            <div class="card-body">
                <h2 class="card-title">${data.place}</h2>
                <p class="card-text">${data.contents.length >= 200 ? data.contents.substring(0, 200) + '...' : data.contents}</p>
            </div>
            <div class="card-footer text-muted">
                <b>${data.mem_date}</b> visited || <b>${data.reg_date}</b> posted
            </div>
        </div>
        `;

        return html;
    }

    function arrangeLoadedKeywords(data) {
        let html = '';
        for(let i=0; i<data.length; i++) {
            html += `
                    <div class="col-lg-6">
                        <a href="#" onclick="memoryInfo.searchMemoryParam('03','${data[i].keyword}');">${data[i].keyword}(${data[i].cnt})</a>
                    </div>
            `;
        }
        document.querySelector('#divKeywords').insertAdjacentHTML('afterbegin', html);
    }

    function _searchMemoryParam(type, keyword) {
        dynamicMap.loadedMarker.forEach(function (marker) { marker.setMap(null); });
        if(type === '01'){
            keyword = document.querySelector('#searchInput').value;
        } else if (type === '02') {
            keyword = document.querySelector('#datePicker').value.replace(/(\s*)/g,'').replace(/-/g,'');
        }
        if(typeof loginUser !== 'undefined' && loginUser !== null){
            const xhr = new XMLHttpRequest();
            xhr.open("GET", `/memories/searchParam/${type}/${keyword}`, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.send();
            xhr.addEventListener('load', function() {
                var res = JSON.parse(xhr.responseText);
                
                dynamicMap.getSavedPlaceMarker(res);
                arrangeLoadedMemories(res);
            });
        } else {
            location.href = '/';
        }
    }

    return {
        init: function() {
            _loadMemory();
            _loadKeyword();
        },

        searchMemoryParam: function(type, keyword){
            _searchMemoryParam(type, keyword);
        }
    }
})();