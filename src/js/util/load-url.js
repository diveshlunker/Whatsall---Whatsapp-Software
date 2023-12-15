		const { shell } = require('electron');
	
		window.addEventListener('DOMContentLoaded', () => {
			const links = document.getElementsByClassName('externalLink');

			for (let i = 0; i < links.length; i++) {
			const link = links[i];

			link.addEventListener('click', (event) => {
				event.preventDefault();
				const url = link.href;
				shell.openExternal(url);
			});
		}
		});
