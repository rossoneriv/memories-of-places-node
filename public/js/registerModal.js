let registerModal = (() => {

    // let modalWrap;
    // window.onload = (function(){
    const modalWrap = document.querySelector('#modal_wrap');
    // });
    
    function _getRegisterModal(props, initFlag) {
        let html = `
        <div class="modal fade" id="modalRegist" tabindex="-1" role="dialog" aria-labelledby="modalRegistTitle" aria-hidden="true" data-backdrop="static">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalTitle">Regist Memories</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">`;

            if(initFlag)    html += getRegistForm(props);
            else            html += getModifyForm(props);
        
        html += `
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary save">저장</button>
                <button type="button" class="btn btn-secondary click closeModal" data-dismiss="modal">닫기</button>
            </div>
            </div>
        </div>
        </div>
        `;

        modalWrap.insertAdjacentHTML('beforeEnd', html);
        $('#modalRegist').modal();
        // $('#modalRegist').data('bs.modal').options.backdrop = 'static';
        const modal = document.querySelector('#modalRegist');

        modal.querySelector('.close').addEventListener('click', closeModal);
        modal.querySelector('.closeModal').addEventListener('click', closeModal);
        modal.querySelector('.save').addEventListener('click', saveModal);
        modal.querySelector('#imgFiles').addEventListener('change', function(e){
            onFileChangeEvent(e.target);
        });
    };

    function getRegistForm(props) {
        const {marker, place, keyArr} = props;
        const [keyword1, keyword2, keyword3] = keyArr ? keyArr.split('_') : '';
        let html=`
        <form id="memoriesForm" method="post" enctype="multipart/form-data" data-form-cate="regist">
            <input type="hidden" name="lat" id="lat" value="${marker.getPosition().Ha}">
            <input type="hidden" name="lon" id="lon" value="${marker.getPosition().Ga}">
            <input type="hidden" name="keyword1" id="keyword1" value="${keyword1}">
            <input type="hidden" name="keyword2" id="keyword2" value="${keyword2}">
            <input type="hidden" name="keyword3" id="keyword3" value="${keyword3}">
            <label for="memoriesFormInputTitle">제목</label>
                <div class="form-group input-group">
                <input type="text" class="form-control" name="place" id="place" value="${place}">
                <span class="input-group-addon"><i class="glyphicon glyphicon-pencil"></i></span>
            </div>
            <label for="memoriesFormInputMemDate">일자</label>
            <div class="input-group form-group">
                <input type="date" class="form-control" name="memDate" id="memDate">
                <span class="input-group-addon"><i class="glyphicon glyphicon-calendar"></i></span>
            </div>
            <label for="memoriesFormTextareaContents">내용</label>
            <div class="form-group">
                <textarea class="form-control" name="memContents" id="memContents" rows="5"></textarea>
            </div>
            <div class="form-group" id="imgPreview">
            </div>
            <label for="memoriesFormInputFile">사진</label>
            <div id="imgFiles">
                <div class="input-group form-group imgUpload">
                    <input type="file" name="uploadImage" class="form-control" accept="image/gif, image/jpeg, image/png">
                    <span class="input-group-addon"><i class="glyphicon glyphicon-file"></i></span>
                </div>
            </div>
        </form>`;
        return html;
    }

    function getModifyForm(props) {
        const {id, lat, lon, keyword1, keyword2, keyword3, place, contents, mem_date, imgList} = props;
        let html=`
        <form id="memoriesForm" method="post" enctype="multipart/form-data" data-form-cate="modify" data-mem-id=${id}>
            <input type="hidden" name="lat" id="lat" value="${lat}">
            <input type="hidden" name="lon" id="lon" value="${lon}">
            <input type="hidden" name="keyword1" id="keyword1" value="${keyword1}">
            <input type="hidden" name="keyword2" id="keyword2" value="${keyword2}">
            <input type="hidden" name="keyword3" id="keyword3" value="${keyword3}">
            <label for="memoriesFormInputTitle">제목</label>
                <div class="form-group input-group">
                <input type="text" class="form-control" name="place" id="place" value="${place}">
                <span class="input-group-addon"><i class="glyphicon glyphicon-pencil"></i></span>
            </div>
            <label for="memoriesFormInputMemDate">일자</label>
            <div class="input-group form-group">
                <input type="date" class="form-control" name="memDate" id="memDate" value="${mem_date}">
                <span class="input-group-addon"><i class="glyphicon glyphicon-calendar"></i></span>
            </div>
            <label for="memoriesFormTextareaContents">내용</label>
            <div class="form-group">
                <textarea class="form-control" name="memContents" id="memContents" rows="7">${contents}</textarea>
            </div>
            <div class="form-group" id="imgPreviewSavedBefore">
                <input type="hidden" name="deleteImgSeqArr" id="deleteImgSeqArr">`;
        for(let i=0; i<imgList.length; i++){
            html += `
                <div class="img-wrap">
                    <span class="delImg" onclick="registerModal.onDeleteImgEvent(this)">&times;</span>
                    <img src="${imgList[i].imgSrc}"alt="" width="80" height="80" data-seq-id=${imgList[i].seq}>
                </div>`;
        }

        html += `
            </div>
            <div class="form-group" id="imgPreview"></div>
            <label for="memoriesFormInputFile">사진</label>
            <div id="imgFiles">
                <div class="input-group form-group imgUpload">
                    <input type="file" name="uploadImage" class="form-control" accept="image/gif, image/jpeg, image/png">
                    <span class="input-group-addon"><i class="glyphicon glyphicon-file"></i></span>
                </div>
            </div>
        </form>`;
        return html;
    }

    const saveModal = () => {        
        const form = modalWrap.querySelector('#memoriesForm');
        const formData = new FormData(form);
        const formCate = form.dataset.formCate;

        let url = '',
            method = '';
        
        if(formCate === 'modify') {
            url = `/memories/${form.dataset.memId}`;
            method = 'PATCH';
        } else {
            url = '/memories';
            method = 'POST';
        }
        const xhr = new XMLHttpRequest();
        xhr.open(method , url , true);
        xhr.send(formData);
        xhr.addEventListener('load', function() {
            // closeModal();
            // document.querySelector('.modal-backdrop').remove();
            modalWrap.querySelector('.closeModal').click();
            if(divMemories.querySelector('#memList'))   divMemories.querySelector('#memList').remove();
            divMemories.querySelector('#noList').style.display = 'block';
            var cell = document.querySelector('#divKeywords'); 
            while ( cell.hasChildNodes() ) { cell.removeChild( cell.firstChild ); }
            memoryInfo.init();
            alert('성공적으로 저장되었습니다.');
        });
    }

    const closeModal = () => {
        modalWrap.firstElementChild.remove();
    }

    const onFileChangeEvent = (that) => {
        let idx;
        let imgFiles = document.querySelector('#imgFiles');
        for(let i=0; i<imgFiles.querySelectorAll('input[type=file]').length; i++){
            if(that === imgFiles.querySelectorAll('input[type=file]')[i]){
                idx = i;
                break;
            }
        }
        let file = that.files[0];
        if(file) {
            if(idx !== imgFiles.querySelectorAll('input[type=file]').length - 1){
                modalWrap.querySelector('#imgPreview').querySelectorAll('img')[idx].src = window.URL.createObjectURL(file);
            }
            else{
                let blobURL = window.URL.createObjectURL(file);
                modalWrap.querySelector('#imgPreview').insertAdjacentHTML('beforeEnd', `
                    <div class="img-wrap">
                        <span class="delImg" onclick="registerModal.onDeleteImgEvent(this)">&times;</span>
                        <img src="${blobURL}"alt="" width="80" height="80" data-seq-id=0>
                    </div>`);
                modalWrap.querySelector('#imgFiles').insertAdjacentHTML('beforeEnd', `
                    <div class="input-group form-group imgUpload">
                        <input type="file" name="uploadImage" class="form-control" accept="image/gif, image/jpeg, image/png">
                        <span class="input-group-addon"><i class="glyphicon glyphicon-file"></i></span>
                    </div>`);
            }
        }
        else {
            imgFiles.querySelectorAll('.imgUpload')[idx].remove();
            modalWrap.querySelector('#imgPreview').querySelectorAll('img')[idx].remove();
        }
    }

    const _onDeleteImgEvent = (that) => {
        if(Number(that.nextElementSibling.dataset.seqId) > 0) {
            if(modalWrap.querySelector('#deleteImgSeqArr').value === '')    modalWrap.querySelector('#deleteImgSeqArr').value = that.nextElementSibling.dataset.seqId;
            else    modalWrap.querySelector('#deleteImgSeqArr').value += ',' + that.nextElementSibling.dataset.seqId;
            modalWrap.querySelector('#deleteImgSeqArr').value += ',' + that.nextElementSibling.dataset.seqId;
            that.closest('.img-wrap').remove();
        } else {
            let idx;
            let imgPreview = modalWrap.querySelector('#imgPreview');
            for(let i=0; i<imgPreview.querySelectorAll('img').length; i++){
                if(that.nextElementSibling === imgPreview.querySelectorAll('img')[i]){
                    idx = i;
                    break;
                }
            }
            modalWrap.querySelector('#imgFiles').querySelectorAll('.imgUpload')[idx].remove();
            that.closest('.img-wrap').remove();
        }
    }

    return {
        getRegisterModal: function(props, initFlag) {
            _getRegisterModal(props, initFlag);
        },

        onDeleteImgEvent: function(that) {
            _onDeleteImgEvent(that);
        }
    }
})();