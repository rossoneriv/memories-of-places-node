let memoryModal = (() => {

    let modalWrap;
    window.onload = (function(){
        modalWrap = document.querySelector('#modal_wrap');
    })();
    
    function _getMemoryModal(props) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `/memories/picture/${props.id}`, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.send();
        xhr.addEventListener('load', function() {
            const imgList = JSON.parse(xhr.responseText);
            let html = getMemoryContents(this, imgList);

            modalWrap.insertAdjacentHTML('beforeEnd', html);
            const modal = document.querySelector('#modalMemory');
            $('#modalMemory').modal();
            modal.querySelector('.close').addEventListener('click', closeModal);
            modal.querySelector('.closeModal').addEventListener('click', closeModal);
            modal.querySelector('.modify').addEventListener('click', function() {
                modalWrap.firstElementChild.remove();
                document.querySelector('.modal-backdrop').remove();
                registerModal.getRegisterModal({...props, imgList}, false);
            }.bind(imgList));
            modal.querySelector('.delete').addEventListener('click', () => {
                deleteMemory(props.id);
            });
        }.bind(props));
    };

    function getMemoryContents(props, imgList) {
        let imgHtml = '';
        for(let i=0; i<imgList.length; i++) {
            imgHtml += `<img class="img-fluid rounded" src=${imgList[i].imgSrc} alt="" style="margin-bottom: 1px;">`;
        }

        let html = `
        <div class="modal fade" id="modalMemory" tabindex="-1" role="dialog" aria-labelledby="modalRegistTitle" aria-hidden="true" data-backdrop="static">
        <div class="modal-dialog modal-dialog-centered" role="document" style="max-width:85vh; overflow-y: initial !important;">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalTitle">${props.place}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body" style="overflow-y: auto; max-height:80vh;">

                <div class="col-lg-12">
                    <div id="imgList" >
                        ${imgHtml}
                    </div>
                    <hr>
                    <p>${props.reg_date} posted</p>
                    <hr>
                    <p class="lead">${props.contents.replace(/\n/gi, '<br>')}</p>

                    <blockquote class="blockquote">
                        <footer class="blockquote-footer">${props.mem_date} in..
                            <cite title="Source Title">${props.place}</cite>
                        </footer>
                    </blockquote>
                </div>

            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary modify">수정</button>
                <button type="button" class="btn btn-danger delete">삭제</button>
                <button type="button" class="btn btn-secondary click closeModal" data-dismiss="modal">닫기</button>
            </div>
            </div>
        </div>
        </div>
        `;
        
        return html;
    }
    
    const deleteMemory = (memId) => {
        if(confirm('삭제하시겠습니까?')){
            const xhr = new XMLHttpRequest();
            xhr.open('DELETE' , `/memories/${memId}` , true);
            xhr.send();
            xhr.addEventListener('load', function(e) {
                modalWrap.querySelector('.closeModal').click();
                divMemories.querySelector('#memList').remove();
                divMemories.querySelector('#noList').style.display = 'block';
                var cell = document.querySelector('#divKeywords'); 
                while ( cell.hasChildNodes() ) { cell.removeChild( cell.firstChild ); }
                memoryInfo.init();
                alert('삭제가 완료되었습니다.');
            });
        }
    }

    const closeModal = () => {
        modalWrap.firstElementChild.remove();
    }

    return {
        getMemoryModal: function(props) {
            _getMemoryModal(props);
        }
    }
})();