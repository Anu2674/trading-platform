import docker
import os

client = docker.from_env()

SANDBOX_IMAGE  = "python:3.11-slim"
MEMORY_LIMIT   = "512m"
CPU_QUOTA      = 200000
CONTAINER_PORT = 8888


def run_sandbox(submission_id: str, file_path: str, host_port: int = 9000) -> dict:
    try:
        stop_sandbox(submission_id)

        upload_dir = os.path.abspath(os.path.dirname(file_path))

        container = client.containers.run(
            image=SANDBOX_IMAGE,
            name=f"sandbox_{submission_id[:8]}",
            command="sleep 300",
            detach=True,
            mem_limit=MEMORY_LIMIT,
            cpu_quota=CPU_QUOTA,
            network_mode="bridge",
            volumes={
                upload_dir: {
                    "bind": "/submission",
                    "mode": "ro"
                }
            },
            ports={f"{CONTAINER_PORT}/tcp": host_port},
            remove=False,
        )

        return {
            "container_id": container.id[:12],
            "container_name": container.name,
            "host_port": host_port,
            "status": "running",
            "endpoint": f"http://localhost:{host_port}",
        }

    except Exception as e:
        return {"status": "error", "detail": str(e)}


def stop_sandbox(submission_id: str):
    try:
        container = client.containers.get(f"sandbox_{submission_id[:8]}")
        container.stop(timeout=5)
        container.remove(force=True)
    except docker.errors.NotFound:
        pass
    except Exception:
        pass


def get_sandbox_status(submission_id: str) -> str:
    try:
        container = client.containers.get(f"sandbox_{submission_id[:8]}")
        return container.status
    except docker.errors.NotFound:
        return "not_found"
